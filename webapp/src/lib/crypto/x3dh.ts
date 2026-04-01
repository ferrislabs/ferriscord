/**
 * X3DH (Extended Triple Diffie-Hellman) key agreement protocol.
 *
 * Used to establish a shared secret between two parties for DM encryption.
 * This is the handshake that initializes the Double Ratchet.
 *
 * Protocol (Alice initiates with Bob):
 *   1. Alice fetches Bob's key bundle (IK_b, SPK_b, OPK_b?)
 *   2. Alice generates ephemeral key pair (EK_a)
 *   3. Alice computes:
 *      DH1 = DH(IK_a, SPK_b)    — Alice identity × Bob signed pre-key
 *      DH2 = DH(EK_a, IK_b)     — Alice ephemeral × Bob identity
 *      DH3 = DH(EK_a, SPK_b)    — Alice ephemeral × Bob signed pre-key
 *      DH4 = DH(EK_a, OPK_b)    — Alice ephemeral × Bob one-time pre-key (if available)
 *   4. SK = HKDF(DH1 || DH2 || DH3 [|| DH4])
 *
 * Note: Ed25519 identity keys are converted to X25519 for DH operations.
 */

import { edwardsToMontgomeryPriv, edwardsToMontgomeryPub } from '@noble/curves/ed25519'
import {
  x25519SharedSecret,
  generateX25519KeyPair,
  deriveKey,
  concatBytes,
  toBase64,
  fromBase64,
  type X25519KeyPair,
} from './keys'
import type { KeyBundle } from './api'

const X3DH_INFO = 'ferriscord-x3dh-v1'

export interface X3dhInitResult {
  /** Shared secret for initializing Double Ratchet */
  sharedSecret: Uint8Array
  /** Ephemeral public key to send to Bob */
  ephemeralPublicKey: Uint8Array
  /** Associated data: IK_a || IK_b (for authenticated encryption) */
  associatedData: Uint8Array
}

/**
 * Initiator (Alice) side of X3DH.
 *
 * @param identityKeyPrivate - Alice's Ed25519 identity private key
 * @param identityKeyPublic - Alice's Ed25519 identity public key
 * @param remoteBundle - Bob's key bundle from the server
 */
export function x3dhInitiate(
  identityKeyPrivate: Uint8Array,
  identityKeyPublic: Uint8Array,
  remoteBundle: KeyBundle,
): X3dhInitResult {
  // Convert Ed25519 identity keys to X25519 for DH
  const ikAPrivX = edwardsToMontgomeryPriv(identityKeyPrivate)
  const ikAPubX = edwardsToMontgomeryPub(identityKeyPublic)

  const ikBPub = fromBase64(remoteBundle.identity_key)
  const ikBPubX = edwardsToMontgomeryPub(ikBPub)

  const spkBPub = fromBase64(remoteBundle.signed_prekey)

  // Generate ephemeral key pair
  const ephemeral: X25519KeyPair = generateX25519KeyPair()

  // Compute DH values
  const dh1 = x25519SharedSecret(ikAPrivX, spkBPub) // IK_a × SPK_b
  const dh2 = x25519SharedSecret(ephemeral.privateKey, ikBPubX) // EK_a × IK_b
  const dh3 = x25519SharedSecret(ephemeral.privateKey, spkBPub) // EK_a × SPK_b

  let dhConcat: Uint8Array
  if (remoteBundle.onetime_prekey) {
    const opkBPub = fromBase64(remoteBundle.onetime_prekey)
    const dh4 = x25519SharedSecret(ephemeral.privateKey, opkBPub) // EK_a × OPK_b
    dhConcat = concatBytes(dh1, dh2, dh3, dh4)
  } else {
    dhConcat = concatBytes(dh1, dh2, dh3)
  }

  // Derive shared secret via HKDF
  const salt = new Uint8Array(32) // zero salt per Signal spec
  const sharedSecret = deriveKey(dhConcat, salt, X3DH_INFO, 32)

  // Associated data = IK_a (X25519) || IK_b (X25519)
  const associatedData = concatBytes(ikAPubX, ikBPubX)

  return {
    sharedSecret,
    ephemeralPublicKey: ephemeral.publicKey,
    associatedData,
  }
}

/**
 * Responder (Bob) side of X3DH.
 * Called when Bob receives Alice's initial message.
 *
 * @param identityKeyPrivate - Bob's Ed25519 identity private key
 * @param identityKeyPublic - Bob's Ed25519 identity public key
 * @param signedPreKeyPrivate - Bob's signed pre-key private key (X25519)
 * @param oneTimePreKeyPrivate - Bob's one-time pre-key private key (X25519), if used
 * @param remoteIdentityKey - Alice's Ed25519 identity public key
 * @param remoteEphemeralKey - Alice's X25519 ephemeral public key
 */
export function x3dhRespond(
  identityKeyPrivate: Uint8Array,
  identityKeyPublic: Uint8Array,
  signedPreKeyPrivate: Uint8Array,
  oneTimePreKeyPrivate: Uint8Array | null,
  remoteIdentityKey: Uint8Array,
  remoteEphemeralKey: Uint8Array,
): X3dhInitResult {
  // Convert Ed25519 identity keys to X25519 for DH
  const ikBPrivX = edwardsToMontgomeryPriv(identityKeyPrivate)
  const ikBPubX = edwardsToMontgomeryPub(identityKeyPublic)

  const ikAPubX = edwardsToMontgomeryPub(remoteIdentityKey)

  // Compute DH values (mirroring the initiator)
  const dh1 = x25519SharedSecret(signedPreKeyPrivate, ikAPubX) // SPK_b × IK_a
  const dh2 = x25519SharedSecret(ikBPrivX, remoteEphemeralKey) // IK_b × EK_a
  const dh3 = x25519SharedSecret(signedPreKeyPrivate, remoteEphemeralKey) // SPK_b × EK_a

  let dhConcat: Uint8Array
  if (oneTimePreKeyPrivate) {
    const dh4 = x25519SharedSecret(oneTimePreKeyPrivate, remoteEphemeralKey) // OPK_b × EK_a
    dhConcat = concatBytes(dh1, dh2, dh3, dh4)
  } else {
    dhConcat = concatBytes(dh1, dh2, dh3)
  }

  // Derive shared secret via HKDF
  const salt = new Uint8Array(32)
  const sharedSecret = deriveKey(dhConcat, salt, X3DH_INFO, 32)

  // Associated data = IK_a (X25519) || IK_b (X25519)
  const associatedData = concatBytes(ikAPubX, ikBPubX)

  return {
    sharedSecret,
    ephemeralPublicKey: new Uint8Array(0), // Responder doesn't generate ephemeral
    associatedData,
  }
}

/**
 * Build initial message header for X3DH.
 * Sent alongside the first encrypted message to allow the responder to compute the shared secret.
 */
export interface X3dhHeader {
  /** Sender's Ed25519 identity public key (base64) */
  identity_key: string
  /** Sender's X25519 ephemeral public key (base64) */
  ephemeral_key: string
  /** ID of the consumed one-time pre-key (null if none available) */
  onetime_prekey_id: string | null
}

export function buildX3dhHeader(
  identityPublicKey: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  onetimePreKeyId: string | null,
): X3dhHeader {
  return {
    identity_key: toBase64(identityPublicKey),
    ephemeral_key: toBase64(ephemeralPublicKey),
    onetime_prekey_id: onetimePreKeyId,
  }
}
