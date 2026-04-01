// ─── Key primitives ──────────────────────────────────────────────────────────
export {
  generateIdentityKeyPair,
  generateX25519KeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  signWithIdentityKey,
  verifyIdentitySignature,
  x25519SharedSecret,
  aesEncrypt,
  aesDecrypt,
  deriveKey,
  generateRandomBytes,
  toBase64,
  fromBase64,
  concatBytes,
} from './keys'

// ─── Key store (IndexedDB) ──────────────────────────────────────────────────
export { keyStore } from './key-store'
export type {
  StoredIdentityKeys,
  StoredDeviceKeys,
  StoredDmSession,
  StoredSenderKey,
  StoredRecoveryCodes,
} from './key-store'

// ─── Key backup ──────────────────────────────────────────────────────────────
export {
  encryptKeyBackup,
  decryptKeyBackup,
  deriveKeyFromPassword,
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptWithRecoveryCode,
} from './key-backup'
export type { KeyBackupPayload } from './key-backup'

// ─── Device manager ─────────────────────────────────────────────────────────
export {
  checkCryptoSetup,
  performFirstTimeSetup,
  restoreFromBackup,
  restoreFromRecoveryCode,
} from './device-manager'

// ─── X3DH ────────────────────────────────────────────────────────────────────
export { x3dhInitiate, x3dhRespond, buildX3dhHeader } from './x3dh'
export type { X3dhInitResult, X3dhHeader } from './x3dh'

// ─── Double Ratchet ──────────────────────────────────────────────────────────
export {
  ratchetInitSender,
  ratchetInitReceiver,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeState,
  deserializeState,
} from './double-ratchet'
export type { RatchetState, MessageHeader } from './double-ratchet'

// ─── Message Crypto ──────────────────────────────────────────────────────────
export { encryptDmMessage, decryptDmMessage, isEncryptedMessage } from './message-crypto'

// ─── API client ──────────────────────────────────────────────────────────────
export { cryptoApi } from './api'
export type {
  DeviceInfo,
  IdentityKeyInfo,
  KeyBundle,
  KeyBackup,
  SenderKeyDistribution,
  DmSessionInfo,
} from './api'
