/**
 * High-level DM message encryption/decryption.
 *
 * Orchestrates X3DH handshake + Double Ratchet for DM conversations.
 * Manages ratchet state persistence in IndexedDB.
 *
 * Wire format for encrypted message content (base64-encoded):
 *   - Version byte (1)
 *   - Header length (2 bytes, big-endian)
 *   - Header (JSON: { dh, pn, n, x3dh? })
 *   - Ciphertext (from Double Ratchet)
 */

import { toBase64, fromBase64 } from './keys'
import { keyStore } from './key-store'
import { cryptoApi } from './api'
import { useCryptoStore } from '@/stores/crypto.store'
import { x3dhInitiate, x3dhRespond, buildX3dhHeader, type X3dhHeader } from './x3dh'
import {
  ratchetInitSender,
  ratchetInitReceiver,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeState,
  deserializeState,
  type RatchetState,
} from './double-ratchet'
import type { X25519KeyPair } from './keys'

const ENCRYPTION_VERSION = 1
const WIRE_VERSION = 0x01

// ─── Wire Format ─────────────────────────────────────────────────────────────

interface WireHeader {
  dh: string
  pn: number
  n: number
  x3dh?: X3dhHeader
}

function encodeWireMessage(header: WireHeader, ciphertext: Uint8Array): string {
  const headerJson = JSON.stringify(header)
  const headerBytes = new TextEncoder().encode(headerJson)
  const buf = new Uint8Array(1 + 2 + headerBytes.length + ciphertext.length)
  buf[0] = WIRE_VERSION
  buf[1] = (headerBytes.length >> 8) & 0xff
  buf[2] = headerBytes.length & 0xff
  buf.set(headerBytes, 3)
  buf.set(ciphertext, 3 + headerBytes.length)
  return toBase64(buf)
}

function decodeWireMessage(encoded: string): { header: WireHeader; ciphertext: Uint8Array } {
  const buf = fromBase64(encoded)
  if (buf[0] !== WIRE_VERSION) throw new Error(`Unsupported wire version: ${buf[0]}`)
  const headerLen = (buf[1] << 8) | buf[2]
  const headerBytes = buf.slice(3, 3 + headerLen)
  const ciphertext = buf.slice(3 + headerLen)
  const header: WireHeader = JSON.parse(new TextDecoder().decode(headerBytes))
  return { header, ciphertext }
}

// ─── Session Management ──────────────────────────────────────────────────────

async function getOrCreateSenderSession(
  userId: string,
  channelId: string,
  recipientUserId: string,
  recipientBundle: Awaited<ReturnType<typeof cryptoApi.getKeyBundle>>[number],
) : Promise<{
  state: RatchetState
  ad: Uint8Array
  isNew: boolean
  peerDeviceId: string
  x3dhHeader?: X3dhHeader
}> {
  const existingSessions = await keyStore.listDmSessions(userId)
  const existing = existingSessions.find(
    (session) =>
      session.channelId === channelId &&
      session.peerUserId === recipientUserId &&
      session.peerDeviceId === recipientBundle.device_id,
  )
  if (existing) {
    const state = deserializeState(existing.ratchetState)
    const ad = new Uint8Array(64)
    return { state, ad, isNew: false, peerDeviceId: existing.peerDeviceId }
  }

  const identityKeys = await keyStore.getIdentityKeys(userId)
  if (!identityKeys) throw new Error('No identity keys — run E2EE setup first')

  const deviceId = useCryptoStore.getState().deviceId
  if (!deviceId) throw new Error('No active device ID — run E2EE setup first')

  const x3dhResult = x3dhInitiate(identityKeys.privateKey, identityKeys.publicKey, recipientBundle)
  const remoteDhPublic = fromBase64(recipientBundle.signed_prekey)
  const state = ratchetInitSender(x3dhResult.sharedSecret, remoteDhPublic)

  const x3dhHeader = buildX3dhHeader(
    identityKeys.publicKey,
    deviceId,
    recipientBundle.device_id,
    x3dhResult.ephemeralPublicKey,
    recipientBundle.onetime_prekey_id ?? null,
  )

  return {
    state,
    ad: x3dhResult.associatedData,
    isNew: true,
    peerDeviceId: recipientBundle.device_id,
    x3dhHeader,
  }
}

/**
 * Handle X3DH respond: called when we receive a first message with an X3DH header.
 */
async function createReceiverSession(
  userId: string,
  x3dh: X3dhHeader,
): Promise<{ state: RatchetState; ad: Uint8Array }> {
  const identityKeys = await keyStore.getIdentityKeys(userId)
  if (!identityKeys) throw new Error('No identity keys — run E2EE setup first')

  const signedPreKey = await keyStore.getSignedPreKey(userId)
  if (!signedPreKey) throw new Error('No signed pre-key — run E2EE setup first')

  // Look up the OTP private key if one was used
  let otpPrivate: Uint8Array | null = null
  if (x3dh.onetime_prekey_id) {
    const otp = await keyStore.getOneTimePreKey(userId, x3dh.onetime_prekey_id)
    if (otp) {
      otpPrivate = otp.privateKey
      // Consume: delete from local store (it's already consumed on the server)
      await keyStore.deleteOneTimePreKey(userId, x3dh.onetime_prekey_id)
    }
  }

  const remoteIdentityKey = fromBase64(x3dh.identity_key)
  const remoteEphemeralKey = fromBase64(x3dh.ephemeral_key)

  const x3dhResult = x3dhRespond(
    identityKeys.privateKey,
    identityKeys.publicKey,
    signedPreKey.privateKey,
    otpPrivate,
    remoteIdentityKey,
    remoteEphemeralKey,
  )

  // Initialize Double Ratchet as receiver using the signed pre-key pair
  const spkPair: X25519KeyPair = {
    publicKey: signedPreKey.publicKey,
    privateKey: signedPreKey.privateKey,
  }
  const state = ratchetInitReceiver(x3dhResult.sharedSecret, spkPair)

  return { state, ad: x3dhResult.associatedData }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Encrypt a DM message.
 */
export async function encryptDmMessage(
  channelId: string,
  recipientUserId: string,
  plaintext: string,
): Promise<{
  encryptedContent: string
  encryptionVersion: number
  devicePayloads: Array<{ targetDeviceId: string; encryptedContent: string }>
}> {
  const userId = useCryptoStore.getState().userId
  if (!userId) throw new Error('User not authenticated for E2EE')
  const currentDeviceId = useCryptoStore.getState().deviceId
  if (!currentDeviceId) throw new Error('No active device ID — run E2EE setup first')

  const recipientBundles = await cryptoApi.getKeyBundle(recipientUserId)
  if (recipientBundles.length === 0) {
    throw new Error('Recipient has no registered E2EE device bundle')
  }

  const ownOtherDeviceBundles = (
    await cryptoApi.getKeyBundle(userId)
  ).filter((bundle) => bundle.device_id !== currentDeviceId)

  const bundleByDevice = new Map<string, (typeof recipientBundles)[number]>()
  for (const bundle of [...recipientBundles, ...ownOtherDeviceBundles]) {
    bundleByDevice.set(bundle.device_id, bundle)
  }

  const plaintextBytes = new TextEncoder().encode(plaintext)
  const devicePayloads: Array<{ targetDeviceId: string; encryptedContent: string }> = []

  for (const bundle of bundleByDevice.values()) {
    const peerUserId = bundle.user_id
    const { state, ad, isNew, peerDeviceId, x3dhHeader } = await getOrCreateSenderSession(
      userId,
      channelId,
      peerUserId,
      bundle,
    )

    const result = ratchetEncrypt(state, plaintextBytes, ad)

    const wireHeader: WireHeader = {
      dh: toBase64(result.header.dh),
      pn: result.header.pn,
      n: result.header.n,
    }
    if (isNew && x3dhHeader) {
      wireHeader.x3dh = x3dhHeader
    }

    await keyStore.saveDmSession(userId, {
      id: `${channelId}:${peerDeviceId}`,
      channelId,
      peerDeviceId,
      peerUserId,
      ratchetState: serializeState(result.state),
      generation: 0,
    })

    devicePayloads.push({
      targetDeviceId: peerDeviceId,
      encryptedContent: encodeWireMessage(wireHeader, result.ciphertext),
    })
  }

  if (devicePayloads.length === 0) {
    throw new Error('No device payload generated for DM message')
  }

  return {
    encryptedContent: devicePayloads[0].encryptedContent,
    encryptionVersion: ENCRYPTION_VERSION,
    devicePayloads,
  }
}

/**
 * Decrypt a DM message.
 */
export async function decryptDmMessage(
  channelId: string,
  senderUserId: string,
  senderDeviceId: string | null | undefined,
  encryptedContent: string,
): Promise<string> {
  const userId = useCryptoStore.getState().userId
  if (!userId) throw new Error('User not authenticated for E2EE')
  const currentDeviceId = useCryptoStore.getState().deviceId
  if (!currentDeviceId) throw new Error('No active device ID — run E2EE setup first')

  const { header: wireHeader, ciphertext } = decodeWireMessage(encryptedContent)
  const peerDeviceId = senderDeviceId ?? wireHeader.x3dh?.sender_device_id
  if (!peerDeviceId) {
    throw new Error('No sender device ID found in message')
  }

  const existing = await keyStore.getDmSession(userId, channelId, peerDeviceId)

  const ratchetHeader = {
    dh: fromBase64(wireHeader.dh),
    pn: wireHeader.pn,
    n: wireHeader.n,
  }

  async function decryptWithState(
    state: RatchetState,
    ad: Uint8Array,
  ): Promise<string> {
    const result = ratchetDecrypt(state, ratchetHeader, ciphertext, ad)

    await keyStore.saveDmSession(userId, {
      id: `${channelId}:${peerDeviceId}`,
      channelId,
      peerDeviceId,
      peerUserId: senderUserId,
      ratchetState: serializeState(result.state),
      generation: 0,
    })

    return new TextDecoder().decode(result.plaintext)
  }

  if (existing) {
    try {
      return await decryptWithState(
        deserializeState(existing.ratchetState),
        new Uint8Array(64),
      )
    } catch (err) {
      // Another browser/device may have restarted the DM session and sent a fresh
      // X3DH bootstrap message. In that case, fall back to rebuilding the
      // receiver session from the wire header.
      if (!wireHeader.x3dh) {
        throw err
      }
    }
  }

  if (!wireHeader.x3dh) {
    throw new Error('No session found and no X3DH header in message')
  }

  // First message from the initiator, or a session reset from another browser.
  if (wireHeader.x3dh.recipient_device_id !== currentDeviceId) {
    throw new Error(
      `Message targets device ${wireHeader.x3dh.recipient_device_id}, current device is ${currentDeviceId}`,
    )
  }
  const session = await createReceiverSession(userId, wireHeader.x3dh)
  return decryptWithState(session.state, session.ad)
}

/**
 * Check if a message is encrypted.
 */
export function isEncryptedMessage(message: {
  encrypted: boolean
  encryption_version: number
}): boolean {
  return message.encrypted && message.encryption_version > 0
}
