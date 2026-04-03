/**
 * Key generation and utilities for E2EE.
 *
 * - Identity keys: Ed25519 (signing)
 * - Device/Pre-keys: X25519 (key agreement)
 * - Message encryption: AES-256-GCM
 */

import { ed25519 } from '@noble/curves/ed25519'
import { x25519 } from '@noble/curves/ed25519'
import { randomBytes } from '@noble/hashes/utils'

// ─── Ed25519 (Identity Keys - signing) ───────────────────────────────────────

export interface Ed25519KeyPair {
  publicKey: Uint8Array // 32 bytes
  privateKey: Uint8Array // 32 bytes (seed)
}

export function generateIdentityKeyPair(): Ed25519KeyPair {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  return { publicKey, privateKey }
}

export function signWithIdentityKey(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey)
}

export function verifyIdentitySignature(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey)
  } catch {
    return false
  }
}

// ─── X25519 (Device/Pre-keys - key agreement) ───────────────────────────────

export interface X25519KeyPair {
  publicKey: Uint8Array // 32 bytes
  privateKey: Uint8Array // 32 bytes
}

export function generateX25519KeyPair(): X25519KeyPair {
  const privateKey = x25519.utils.randomPrivateKey()
  const publicKey = x25519.getPublicKey(privateKey)
  return { publicKey, privateKey }
}

/**
 * Perform X25519 Diffie-Hellman key exchange.
 * Returns a 32-byte shared secret.
 */
export function x25519SharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array,
): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey)
}

// ─── Batch Pre-Key Generation ────────────────────────────────────────────────

export function generateSignedPreKey(identityPrivateKey: Uint8Array): {
  keyPair: X25519KeyPair
  signature: Uint8Array
} {
  const keyPair = generateX25519KeyPair()
  const signature = signWithIdentityKey(identityPrivateKey, keyPair.publicKey)
  return { keyPair, signature }
}

export function generateOneTimePreKeys(count: number): X25519KeyPair[] {
  return Array.from({ length: count }, () => generateX25519KeyPair())
}

// ─── AES-256-GCM ─────────────────────────────────────────────────────────────

import { gcm } from '@noble/ciphers/aes'

const NONCE_SIZE = 12 // 96 bits for AES-GCM

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns nonce (12 bytes) || ciphertext || tag (16 bytes).
 */
export function aesEncrypt(key: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const nonce = randomBytes(NONCE_SIZE)
  const cipher = gcm(key, nonce)
  const ciphertext = cipher.encrypt(plaintext)
  // Prepend nonce to ciphertext
  const result = new Uint8Array(NONCE_SIZE + ciphertext.length)
  result.set(nonce)
  result.set(ciphertext, NONCE_SIZE)
  return result
}

/**
 * Decrypt AES-256-GCM ciphertext (nonce || ciphertext || tag).
 */
export function aesDecrypt(key: Uint8Array, data: Uint8Array): Uint8Array {
  const nonce = data.slice(0, NONCE_SIZE)
  const ciphertext = data.slice(NONCE_SIZE)
  const cipher = gcm(key, nonce)
  return cipher.decrypt(ciphertext)
}

// ─── HKDF ────────────────────────────────────────────────────────────────────

import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'

/**
 * Derive a key using HKDF-SHA256.
 */
export function deriveKey(
  inputKeyMaterial: Uint8Array,
  salt: Uint8Array,
  info: string,
  length: number = 32,
): Uint8Array {
  return hkdf(sha256, inputKeyMaterial, salt, info, length)
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function generateRandomBytes(length: number): Uint8Array {
  return randomBytes(length)
}

/**
 * Encode bytes to base64 string (for API transport).
 */
export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Decode base64 string to bytes.
 */
export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Concatenate multiple Uint8Arrays.
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}
