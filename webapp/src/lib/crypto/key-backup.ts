/**
 * Key backup and recovery using Argon2id-derived encryption.
 *
 * The "security password" is distinct from the OIDC login password.
 * It's used to derive an AES-256-GCM key that encrypts all private keys.
 * Recovery codes provide an alternative decryption path.
 */

import { argon2id } from '@noble/hashes/argon2'
import { hmac } from '@noble/hashes/hmac'
import { sha256 } from '@noble/hashes/sha256'
import { aesEncrypt, aesDecrypt, generateRandomBytes, toBase64, fromBase64 } from './keys'

// Argon2id parameters — tuned for browser (pure-JS implementation).
// Lower memory avoids freezing the main thread.
const ARGON2_TIME_COST = 2
const ARGON2_MEMORY_COST = 4096 // 4 MiB (browser-friendly)
const ARGON2_PARALLELISM = 1
const ARGON2_OUTPUT_LENGTH = 32 // 256 bits for AES-256
const SALT_LENGTH = 16

/**
 * Derive a 256-bit encryption key from a password using Argon2id.
 */
export function deriveKeyFromPassword(password: string, salt: Uint8Array): Uint8Array {
  return argon2id(new TextEncoder().encode(password), salt, {
    t: ARGON2_TIME_COST,
    m: ARGON2_MEMORY_COST,
    p: ARGON2_PARALLELISM,
    dkLen: ARGON2_OUTPUT_LENGTH,
  })
}

/**
 * Payload structure for the encrypted key backup.
 * Contains all private keys needed to decrypt E2EE messages.
 */
export interface KeyBackupPayload {
  identityPrivateKey: Uint8Array
  devicePrivateKey: Uint8Array
  deviceId: string
}

/**
 * Serialize the backup payload into a single byte array.
 * Format: [identityKeyLen(4)] [identityKey] [deviceKeyLen(4)] [deviceKey] [deviceId(utf8)]
 */
function serializePayload(payload: KeyBackupPayload): Uint8Array {
  const deviceIdBytes = new TextEncoder().encode(payload.deviceId)

  const buf = new Uint8Array(
    4 + payload.identityPrivateKey.length +
    4 + payload.devicePrivateKey.length +
    deviceIdBytes.length,
  )

  const view = new DataView(buf.buffer)
  let offset = 0

  view.setUint32(offset, payload.identityPrivateKey.length)
  offset += 4
  buf.set(payload.identityPrivateKey, offset)
  offset += payload.identityPrivateKey.length

  view.setUint32(offset, payload.devicePrivateKey.length)
  offset += 4
  buf.set(payload.devicePrivateKey, offset)
  offset += payload.devicePrivateKey.length

  buf.set(deviceIdBytes, offset)

  return buf
}

/**
 * Deserialize the backup payload from bytes.
 */
function deserializePayload(data: Uint8Array): KeyBackupPayload {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 0

  const identityLen = view.getUint32(offset)
  offset += 4
  const identityPrivateKey = data.slice(offset, offset + identityLen)
  offset += identityLen

  const deviceLen = view.getUint32(offset)
  offset += 4
  const devicePrivateKey = data.slice(offset, offset + deviceLen)
  offset += deviceLen

  const deviceId = new TextDecoder().decode(data.slice(offset))

  return { identityPrivateKey, devicePrivateKey, deviceId }
}

/**
 * Encrypt the key backup with a password.
 * Returns the encrypted blob and salt.
 */
export function encryptKeyBackup(
  password: string,
  payload: KeyBackupPayload,
): { encryptedBlob: Uint8Array; salt: Uint8Array } {
  const salt = generateRandomBytes(SALT_LENGTH)
  const derivedKey = deriveKeyFromPassword(password, salt)
  const plaintext = serializePayload(payload)
  const encryptedBlob = aesEncrypt(derivedKey, plaintext)

  return { encryptedBlob, salt }
}

/**
 * Decrypt a key backup with a password.
 */
export function decryptKeyBackup(
  password: string,
  encryptedBlob: Uint8Array,
  salt: Uint8Array,
): KeyBackupPayload {
  const derivedKey = deriveKeyFromPassword(password, salt)
  const plaintext = aesDecrypt(derivedKey, encryptedBlob)
  return deserializePayload(plaintext)
}

// ─── Recovery Codes ──────────────────────────────────────────────────────────

const RECOVERY_CODE_COUNT = 8
const RECOVERY_CODE_LENGTH = 6 // characters per segment
const RECOVERY_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0, O, I, 1

/**
 * Generate a set of recovery codes.
 * Each code is formatted as XXXXXX-XXXXXX (two segments).
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const bytes = generateRandomBytes(RECOVERY_CODE_LENGTH * 2)
    let code = ''
    for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
      code += RECOVERY_CODE_CHARSET[bytes[j] % RECOVERY_CODE_CHARSET.length]
    }
    code += '-'
    for (let j = RECOVERY_CODE_LENGTH; j < RECOVERY_CODE_LENGTH * 2; j++) {
      code += RECOVERY_CODE_CHARSET[bytes[j] % RECOVERY_CODE_CHARSET.length]
    }
    codes.push(code)
  }
  return codes
}

/**
 * Encrypt recovery codes so they can be stored on the server.
 *
 * Approach: generate a random "recovery master key", encrypt the backup payload
 * with it once, then wrap that key using HMAC-SHA256(code, salt) for each code.
 * This avoids running Argon2id per code (which would freeze the browser).
 */
export function encryptRecoveryCodes(
  codes: string[],
  backupPayload: KeyBackupPayload,
): Uint8Array {
  // Encrypt payload once with a random key
  const recoveryMasterKey = generateRandomBytes(32)
  const plaintext = serializePayload(backupPayload)
  const encryptedPayload = aesEncrypt(recoveryMasterKey, plaintext)

  // Wrap the master key for each recovery code using HMAC
  const wrappedKeys = codes.map((code) => {
    const salt = generateRandomBytes(SALT_LENGTH)
    const wrappingKey = hmac(sha256, new TextEncoder().encode(code), salt)
    const wrappedMasterKey = aesEncrypt(wrappingKey, recoveryMasterKey)
    return {
      salt: toBase64(salt),
      wrapped_key: toBase64(wrappedMasterKey),
    }
  })

  const blob = {
    encrypted_payload: toBase64(encryptedPayload),
    wrapped_keys: wrappedKeys,
  }

  return new TextEncoder().encode(JSON.stringify(blob))
}

/**
 * Try to decrypt the key backup using a recovery code.
 */
export function decryptWithRecoveryCode(
  code: string,
  recoveryCodesBlob: Uint8Array,
): KeyBackupPayload | null {
  const blob: {
    encrypted_payload: string
    wrapped_keys: Array<{ salt: string; wrapped_key: string }>
  } = JSON.parse(new TextDecoder().decode(recoveryCodesBlob))

  const encryptedPayload = fromBase64(blob.encrypted_payload)

  for (const entry of blob.wrapped_keys) {
    try {
      const salt = fromBase64(entry.salt)
      const wrappedMasterKey = fromBase64(entry.wrapped_key)
      const wrappingKey = hmac(sha256, new TextEncoder().encode(code), salt)
      const recoveryMasterKey = aesDecrypt(wrappingKey, wrappedMasterKey)
      const plaintext = aesDecrypt(recoveryMasterKey, encryptedPayload)
      return deserializePayload(plaintext)
    } catch {
      // Wrong code for this entry — try next
    }
  }

  return null
}
