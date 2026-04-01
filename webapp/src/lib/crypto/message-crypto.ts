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

import { toBase64, fromBase64, concatBytes } from './keys'
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
): Promise<{ state: RatchetState; ad: Uint8Array; isNew: boolean; x3dhHeader?: X3dhHeader }> {
  const existing = await keyStore.getDmSession(userId, channelId)
  if (existing) {
    const state = deserializeState(existing.ratchetState)
    const ad = new Uint8Array(64)
    return { state, ad, isNew: false }
  }

  const identityKeys = await keyStore.getIdentityKeys(userId)
  if (!identityKeys) throw new Error('No identity keys — run E2EE setup first')

  const bundle = await cryptoApi.getKeyBundle(recipientUserId)
  const x3dhResult = x3dhInitiate(identityKeys.privateKey, identityKeys.publicKey, bundle)
  const remoteDhPublic = fromBase64(bundle.signed_prekey)
  const state = ratchetInitSender(x3dhResult.sharedSecret, remoteDhPublic)

  const x3dhHeader = buildX3dhHeader(
    identityKeys.publicKey,
    x3dhResult.ephemeralPublicKey,
    bundle.onetime_prekey_id,
  )

  return { state, ad: x3dhResult.associatedData, isNew: true, x3dhHeader }
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
): Promise<{ encryptedContent: string; encryptionVersion: number }> {
  const userId = useCryptoStore.getState().userId
  if (!userId) throw new Error('User not authenticated for E2EE')

  const { state, ad, isNew, x3dhHeader } = await getOrCreateSenderSession(
    userId,
    channelId,
    recipientUserId,
  )

  const plaintextBytes = new TextEncoder().encode(plaintext)
  const result = ratchetEncrypt(state, plaintextBytes, ad)

  const wireHeader: WireHeader = {
    dh: toBase64(result.header.dh),
    pn: result.header.pn,
    n: result.header.n,
  }
  if (isNew && x3dhHeader) {
    wireHeader.x3dh = x3dhHeader
  }

  // Persist updated ratchet state
  await keyStore.saveDmSession(userId, {
    id: channelId,
    ratchetState: serializeState(result.state),
    generation: 0,
  })

  return {
    encryptedContent: encodeWireMessage(wireHeader, result.ciphertext),
    encryptionVersion: ENCRYPTION_VERSION,
  }
}

/**
 * Decrypt a DM message.
 */
export async function decryptDmMessage(
  channelId: string,
  senderUserId: string,
  encryptedContent: string,
): Promise<string> {
  const userId = useCryptoStore.getState().userId
  if (!userId) throw new Error('User not authenticated for E2EE')

  const { header: wireHeader, ciphertext } = decodeWireMessage(encryptedContent)

  let state: RatchetState
  let ad: Uint8Array
  const existing = await keyStore.getDmSession(userId, channelId)

  if (existing) {
    state = deserializeState(existing.ratchetState)
    ad = new Uint8Array(64)
  } else if (wireHeader.x3dh) {
    // First message from the initiator — we are the responder
    const session = await createReceiverSession(userId, wireHeader.x3dh)
    state = session.state
    ad = session.ad
  } else {
    throw new Error('No session found and no X3DH header in message')
  }

  const ratchetHeader = {
    dh: fromBase64(wireHeader.dh),
    pn: wireHeader.pn,
    n: wireHeader.n,
  }

  const result = ratchetDecrypt(state, ratchetHeader, ciphertext, ad)

  // Persist updated state
  await keyStore.saveDmSession(userId, {
    id: channelId,
    ratchetState: serializeState(result.state),
    generation: 0,
  })

  return new TextDecoder().decode(result.plaintext)
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
