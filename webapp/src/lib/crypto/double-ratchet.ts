/**
 * Double Ratchet Algorithm (Signal Protocol).
 *
 * Provides forward secrecy per message via two ratchets:
 *   1. Symmetric ratchet (KDF chain): derives a new message key for each message
 *   2. DH ratchet: performs a new DH exchange each time the sender changes,
 *      resetting the chain keys for both directions
 *
 * State:
 *   - DHs: our current DH key pair
 *   - DHr: their current DH public key
 *   - RK:  root key (ratcheted with each DH exchange)
 *   - CKs: sending chain key
 *   - CKr: receiving chain key
 *   - Ns:  message number (sending)
 *   - Nr:  message number (receiving)
 *   - PN:  previous sending chain length
 *   - MKSKIPPED: dictionary of skipped message keys
 */

import {
  generateX25519KeyPair,
  x25519SharedSecret,
  concatBytes,
  type X25519KeyPair,
} from './keys'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

const MAX_SKIP = 256 // Maximum messages to skip in a chain
const RATCHET_INFO = 'ferriscord-ratchet-v1'
const CHAIN_INFO = 'ferriscord-chain-v1'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MessageHeader {
  /** Sender's current DH public key */
  dh: Uint8Array
  /** Previous chain message count */
  pn: number
  /** Message number in current chain */
  n: number
}

export interface RatchetState {
  DHs: X25519KeyPair // Our DH key pair
  DHr: Uint8Array | null // Their DH public key
  RK: Uint8Array // Root key
  CKs: Uint8Array | null // Sending chain key
  CKr: Uint8Array | null // Receiving chain key
  Ns: number // Sending message number
  Nr: number // Receiving message number
  PN: number // Previous chain length
  MKSKIPPED: Map<string, Uint8Array> // Skipped message keys: "dhPub_hex:n" → key
}

// ─── Serialization ───────────────────────────────────────────────────────────

function skipKey(dh: Uint8Array, n: number): string {
  return `${Array.from(dh.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('')}:${n}`
}

export function serializeState(state: RatchetState): Uint8Array {
  const obj = {
    DHs_pub: Array.from(state.DHs.publicKey),
    DHs_priv: Array.from(state.DHs.privateKey),
    DHr: state.DHr ? Array.from(state.DHr) : null,
    RK: Array.from(state.RK),
    CKs: state.CKs ? Array.from(state.CKs) : null,
    CKr: state.CKr ? Array.from(state.CKr) : null,
    Ns: state.Ns,
    Nr: state.Nr,
    PN: state.PN,
    MKSKIPPED: Object.fromEntries(
      Array.from(state.MKSKIPPED.entries()).map(([k, v]) => [k, Array.from(v)]),
    ),
  }
  return new TextEncoder().encode(JSON.stringify(obj))
}

export function deserializeState(data: Uint8Array): RatchetState {
  const obj = JSON.parse(new TextDecoder().decode(data))
  return {
    DHs: {
      publicKey: new Uint8Array(obj.DHs_pub),
      privateKey: new Uint8Array(obj.DHs_priv),
    },
    DHr: obj.DHr ? new Uint8Array(obj.DHr) : null,
    RK: new Uint8Array(obj.RK),
    CKs: obj.CKs ? new Uint8Array(obj.CKs) : null,
    CKr: obj.CKr ? new Uint8Array(obj.CKr) : null,
    Ns: obj.Ns,
    Nr: obj.Nr,
    PN: obj.PN,
    MKSKIPPED: new Map(
      Object.entries(obj.MKSKIPPED || {}).map(([k, v]) => [k, new Uint8Array(v as number[])]),
    ),
  }
}

// ─── KDF Chains ──────────────────────────────────────────────────────────────

/**
 * Root key KDF: ratchets the root key and produces a new chain key.
 * RK, CK = HKDF(RK, DH_output)
 */
function kdfRK(rk: Uint8Array, dhOut: Uint8Array): [Uint8Array, Uint8Array] {
  const derived = hkdf(sha256, dhOut, rk, RATCHET_INFO, 64)
  return [derived.slice(0, 32), derived.slice(32, 64)]
}

/**
 * Chain key KDF: ratchets the chain key and produces a message key.
 * CK_next, MK = HKDF(CK, 0x01)
 */
function kdfCK(ck: Uint8Array): [Uint8Array, Uint8Array] {
  const input = new Uint8Array([0x01])
  const derived = hkdf(sha256, ck, input, CHAIN_INFO, 64)
  return [derived.slice(0, 32), derived.slice(32, 64)]
}

// ─── Initialization ──────────────────────────────────────────────────────────

/**
 * Initialize ratchet as the sender (Alice, who initiated X3DH).
 * Alice knows Bob's signed pre-key public as the initial DHr.
 */
export function ratchetInitSender(
  sharedSecret: Uint8Array,
  remoteDhPublic: Uint8Array,
): RatchetState {
  const DHs = generateX25519KeyPair()
  const dhOut = x25519SharedSecret(DHs.privateKey, remoteDhPublic)
  const [RK, CKs] = kdfRK(sharedSecret, dhOut)

  return {
    DHs,
    DHr: remoteDhPublic,
    RK,
    CKs,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map(),
  }
}

/**
 * Initialize ratchet as the receiver (Bob, who receives Alice's first message).
 * Bob uses his signed pre-key pair as the initial DH.
 */
export function ratchetInitReceiver(
  sharedSecret: Uint8Array,
  signedPreKeyPair: X25519KeyPair,
): RatchetState {
  return {
    DHs: signedPreKeyPair,
    DHr: null,
    RK: sharedSecret,
    CKs: null,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map(),
  }
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

/**
 * Encrypt a message using the Double Ratchet.
 * Returns the header and ciphertext, and updates the state in-place.
 */
export function ratchetEncrypt(
  state: RatchetState,
  plaintext: Uint8Array,
  ad: Uint8Array,
): { header: MessageHeader; ciphertext: Uint8Array; state: RatchetState } {
  if (!state.CKs) {
    throw new Error('Cannot encrypt: no sending chain key (receiver not yet initialized)')
  }

  const [CKs_next, mk] = kdfCK(state.CKs)

  const header: MessageHeader = {
    dh: state.DHs.publicKey,
    pn: state.PN,
    n: state.Ns,
  }

  // Encrypt: AES-256-GCM with the message key
  // AD = associated_data || header_bytes
  const headerBytes = encodeHeader(header)
  const fullAd = concatBytes(ad, headerBytes)
  const ciphertext = aesEncryptWithAd(mk, plaintext, fullAd)

  const newState: RatchetState = {
    ...state,
    CKs: CKs_next,
    Ns: state.Ns + 1,
  }

  return { header, ciphertext, state: newState }
}

/**
 * Decrypt a message using the Double Ratchet.
 * Handles DH ratchet steps and skipped messages.
 */
export function ratchetDecrypt(
  state: RatchetState,
  header: MessageHeader,
  ciphertext: Uint8Array,
  ad: Uint8Array,
): { plaintext: Uint8Array; state: RatchetState } {
  // Try skipped message keys first
  const skippedKey = skipKey(header.dh, header.n)
  const mk = state.MKSKIPPED.get(skippedKey)
  if (mk) {
    const newSkipped = new Map(state.MKSKIPPED)
    newSkipped.delete(skippedKey)
    const headerBytes = encodeHeader(header)
    const fullAd = concatBytes(ad, headerBytes)
    const plaintext = aesDecryptWithAd(mk, ciphertext, fullAd)
    return { plaintext, state: { ...state, MKSKIPPED: newSkipped } }
  }

  let currentState = { ...state, MKSKIPPED: new Map(state.MKSKIPPED) }

  // Check if we need a DH ratchet step
  if (!state.DHr || !arraysEqual(header.dh, state.DHr)) {
    // Skip any remaining messages in the current receiving chain
    if (state.CKr) {
      currentState = skipMessageKeys(currentState, header.pn)
    }

    // DH ratchet step
    currentState = dhRatchetStep(currentState, header)
  }

  // Skip message keys up to header.n
  currentState = skipMessageKeys(currentState, header.n)

  // Derive message key
  if (!currentState.CKr) {
    throw new Error('Cannot decrypt: no receiving chain key')
  }
  const [CKr_next, msgKey] = kdfCK(currentState.CKr)
  currentState.CKr = CKr_next
  currentState.Nr = currentState.Nr + 1

  const headerBytes = encodeHeader(header)
  const fullAd = concatBytes(ad, headerBytes)
  const plaintext = aesDecryptWithAd(msgKey, ciphertext, fullAd)

  return { plaintext, state: currentState }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function dhRatchetStep(state: RatchetState, header: MessageHeader): RatchetState {
  const newState = { ...state }

  newState.PN = state.Ns
  newState.Ns = 0
  newState.Nr = 0
  newState.DHr = header.dh

  // Derive new receiving chain key
  const dhOut1 = x25519SharedSecret(state.DHs.privateKey, header.dh)
  const [RK1, CKr] = kdfRK(state.RK, dhOut1)
  newState.RK = RK1
  newState.CKr = CKr

  // Generate new DH key pair and derive new sending chain key
  newState.DHs = generateX25519KeyPair()
  const dhOut2 = x25519SharedSecret(newState.DHs.privateKey, header.dh)
  const [RK2, CKs] = kdfRK(newState.RK, dhOut2)
  newState.RK = RK2
  newState.CKs = CKs

  return newState
}

function skipMessageKeys(state: RatchetState, until: number): RatchetState {
  if (!state.CKr) return state
  if (until - state.Nr > MAX_SKIP) {
    throw new Error(`Too many skipped messages: ${until - state.Nr}`)
  }

  const newState = { ...state, MKSKIPPED: new Map(state.MKSKIPPED) }
  while (newState.Nr < until) {
    const [CKr_next, mk] = kdfCK(newState.CKr!)
    const key = skipKey(newState.DHr!, newState.Nr)
    newState.MKSKIPPED.set(key, mk)
    newState.CKr = CKr_next
    newState.Nr += 1
  }

  return newState
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// ─── Header Encoding ─────────────────────────────────────────────────────────

function encodeHeader(header: MessageHeader): Uint8Array {
  // Fixed format: dh (32) + pn (4) + n (4) = 40 bytes
  const buf = new Uint8Array(40)
  buf.set(header.dh, 0)
  const view = new DataView(buf.buffer)
  view.setUint32(32, header.pn)
  view.setUint32(36, header.n)
  return buf
}

export function decodeHeader(data: Uint8Array): MessageHeader {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return {
    dh: data.slice(0, 32),
    pn: view.getUint32(32),
    n: view.getUint32(36),
  }
}

// ─── AEAD (AES-256-GCM with associated data) ────────────────────────────────

import { gcm } from '@noble/ciphers/aes'
import { randomBytes } from '@noble/hashes/utils'

const NONCE_SIZE = 12

function aesEncryptWithAd(
  key: Uint8Array,
  plaintext: Uint8Array,
  ad: Uint8Array,
): Uint8Array {
  const nonce = randomBytes(NONCE_SIZE)
  const cipher = gcm(key, nonce, ad)
  const ct = cipher.encrypt(plaintext)
  const result = new Uint8Array(NONCE_SIZE + ct.length)
  result.set(nonce)
  result.set(ct, NONCE_SIZE)
  return result
}

function aesDecryptWithAd(
  key: Uint8Array,
  data: Uint8Array,
  ad: Uint8Array,
): Uint8Array {
  const nonce = data.slice(0, NONCE_SIZE)
  const ct = data.slice(NONCE_SIZE)
  const cipher = gcm(key, nonce, ad)
  return cipher.decrypt(ct)
}
