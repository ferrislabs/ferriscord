/**
 * Device manager: handles the E2EE initialization flow.
 *
 * First-time setup:
 *   1. Generate identity key pair (Ed25519) + device key pair (X25519)
 *   2. Upload identity public key, register device
 *   3. Generate + upload signed pre-key, store private key locally
 *   4. Generate + upload 100 OTPs, store private keys locally (keyed by server ID)
 *   5. Encrypt backup + recovery codes, upload to server
 *   6. Store all keys locally in IndexedDB
 *
 * Returning device (keys in IndexedDB):
 *   1. Load keys from IndexedDB → mark setup as complete
 *
 * New device (no local keys, backup exists):
 *   1. Prompt for security password
 *   2. Download + decrypt backup → generate new device key pair
 *   3. Register new device, upload fresh pre-keys, store locally
 */

import {
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  generateX25519KeyPair,
  toBase64,
  fromBase64,
} from './keys'
import {
  encryptKeyBackup,
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptKeyBackup,
  type KeyBackupPayload,
} from './key-backup'
import { keyStore } from './key-store'
import { cryptoApi } from './api'
import { useCryptoStore } from '@/stores/crypto.store'

const ONE_TIME_PREKEY_COUNT = 100

function getDeviceName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return `Firefox on ${navigator.platform}`
  if (ua.includes('Chrome')) return `Chrome on ${navigator.platform}`
  if (ua.includes('Safari')) return `Safari on ${navigator.platform}`
  return `Browser on ${navigator.platform}`
}

/**
 * Check if E2EE is already set up locally and restore state.
 */
export async function checkCryptoSetup(userId: string): Promise<void> {
  const store = useCryptoStore.getState()
  store.setUserId(userId)

  const isLocal = await keyStore.isSetUp(userId)
  if (isLocal) {
    const deviceKeys = await keyStore.getDeviceKeys(userId)
    if (deviceKeys) {
      store.setDeviceId(deviceKeys.deviceId)
      store.setSetupStatus('setup')
      store.setUnlocked(true)
    }
    return
  }

  // No local keys — check if server has a backup
  try {
    await cryptoApi.getKeyBackup()
    store.setSetupStatus('locked')
  } catch {
    store.setSetupStatus('not_setup')
  }
}

/**
 * First-time E2EE setup. Returns recovery codes to display to the user.
 */
export async function performFirstTimeSetup(
  userId: string,
  securityPassword: string,
): Promise<string[]> {
  // 1. Generate all key pairs
  const identityKeyPair = generateIdentityKeyPair()
  const deviceKeyPair = generateX25519KeyPair()
  const signedPreKey = generateSignedPreKey(identityKeyPair.privateKey)
  const oneTimePreKeys = generateOneTimePreKeys(ONE_TIME_PREKEY_COUNT)

  // 2. Upload identity key + register device
  await cryptoApi.uploadIdentityKey(toBase64(identityKeyPair.publicKey))
  const device = await cryptoApi.registerDevice(
    getDeviceName(),
    toBase64(deviceKeyPair.publicKey),
  )

  // 3. Upload signed pre-key
  await cryptoApi.uploadSignedPreKey(
    toBase64(signedPreKey.keyPair.publicKey),
    toBase64(signedPreKey.signature),
  )

  // 4. Upload OTPs — server returns assigned IDs
  const otpResponse = await cryptoApi.uploadOneTimePreKeys(
    oneTimePreKeys.map((kp) => ({ public_key: toBase64(kp.publicKey) })),
  )

  // 5. Store signed pre-key private key locally
  await keyStore.saveSignedPreKey(userId, {
    id: 'current',
    publicKey: signedPreKey.keyPair.publicKey,
    privateKey: signedPreKey.keyPair.privateKey,
  })

  // 6. Store OTP private keys locally, keyed by server-assigned ID
  for (let i = 0; i < oneTimePreKeys.length; i++) {
    const serverId = otpResponse.ids[i]
    if (serverId) {
      await keyStore.saveOneTimePreKey(userId, {
        id: serverId,
        publicKey: oneTimePreKeys[i].publicKey,
        privateKey: oneTimePreKeys[i].privateKey,
      })
    }
  }

  // 7. Create + upload backup
  const backupPayload: KeyBackupPayload = {
    identityPrivateKey: identityKeyPair.privateKey,
    devicePrivateKey: deviceKeyPair.privateKey,
    deviceId: device.id,
  }
  const { encryptedBlob, salt } = encryptKeyBackup(securityPassword, backupPayload)
  const recoveryCodes = generateRecoveryCodes()
  const recoveryCodesBlob = encryptRecoveryCodes(recoveryCodes, backupPayload)

  await cryptoApi.uploadKeyBackup({
    encrypted_blob: toBase64(encryptedBlob),
    salt: toBase64(salt),
    nonce: toBase64(new Uint8Array(0)),
    recovery_codes: toBase64(recoveryCodesBlob),
  })

  // 8. Store identity + device keys locally
  await keyStore.saveIdentityKeys(userId, {
    id: 'current',
    publicKey: identityKeyPair.publicKey,
    privateKey: identityKeyPair.privateKey,
  })
  await keyStore.saveDeviceKeys(userId, {
    id: 'current',
    deviceId: device.id,
    publicKey: deviceKeyPair.publicKey,
    privateKey: deviceKeyPair.privateKey,
  })
  await keyStore.saveRecoveryCodes(userId, recoveryCodes)

  // 9. Update store
  const store = useCryptoStore.getState()
  store.setDeviceId(device.id)
  store.setSetupStatus('setup')
  store.setUnlocked(true)

  return recoveryCodes
}

/**
 * Restore keys from server backup using security password.
 */
export async function restoreFromBackup(
  userId: string,
  securityPassword: string,
): Promise<void> {
  const backup = await cryptoApi.getKeyBackup()
  const encryptedBlob = fromBase64(backup.encrypted_blob)
  const salt = fromBase64(backup.salt)
  const payload = decryptKeyBackup(securityPassword, encryptedBlob, salt)

  const deviceKeyPair = generateX25519KeyPair()
  const device = await cryptoApi.registerDevice(
    getDeviceName(),
    toBase64(deviceKeyPair.publicKey),
  )

  // Upload fresh pre-keys for the new device
  const identityPublicKey = fromBase64(
    (await cryptoApi.getIdentityKey(userId)).public_key,
  )
  const signedPreKey = generateSignedPreKey(payload.identityPrivateKey)
  await cryptoApi.uploadSignedPreKey(
    toBase64(signedPreKey.keyPair.publicKey),
    toBase64(signedPreKey.signature),
  )
  await keyStore.saveSignedPreKey(userId, {
    id: 'current',
    publicKey: signedPreKey.keyPair.publicKey,
    privateKey: signedPreKey.keyPair.privateKey,
  })

  const oneTimePreKeys = generateOneTimePreKeys(ONE_TIME_PREKEY_COUNT)
  const otpResponse = await cryptoApi.uploadOneTimePreKeys(
    oneTimePreKeys.map((kp) => ({ public_key: toBase64(kp.publicKey) })),
  )
  for (let i = 0; i < oneTimePreKeys.length; i++) {
    const serverId = otpResponse.ids[i]
    if (serverId) {
      await keyStore.saveOneTimePreKey(userId, {
        id: serverId,
        publicKey: oneTimePreKeys[i].publicKey,
        privateKey: oneTimePreKeys[i].privateKey,
      })
    }
  }

  await keyStore.saveIdentityKeys(userId, {
    id: 'current',
    publicKey: identityPublicKey,
    privateKey: payload.identityPrivateKey,
  })
  await keyStore.saveDeviceKeys(userId, {
    id: 'current',
    deviceId: device.id,
    publicKey: deviceKeyPair.publicKey,
    privateKey: deviceKeyPair.privateKey,
  })

  const store = useCryptoStore.getState()
  store.setDeviceId(device.id)
  store.setSetupStatus('setup')
  store.setUnlocked(true)
}

/**
 * Restore keys using a recovery code.
 */
export async function restoreFromRecoveryCode(
  userId: string,
  recoveryCode: string,
  newSecurityPassword: string,
): Promise<string[]> {
  const backup = await cryptoApi.getKeyBackup()
  const recoveryCodesBlob = fromBase64(backup.recovery_codes)

  const { decryptWithRecoveryCode } = await import('./key-backup')
  const payload = decryptWithRecoveryCode(recoveryCode, recoveryCodesBlob)
  if (!payload) throw new Error('Invalid recovery code')

  const deviceKeyPair = generateX25519KeyPair()
  const device = await cryptoApi.registerDevice(
    getDeviceName(),
    toBase64(deviceKeyPair.publicKey),
  )

  const updatedPayload: KeyBackupPayload = { ...payload, deviceId: device.id }
  const { encryptedBlob, salt } = encryptKeyBackup(newSecurityPassword, updatedPayload)
  const newRecoveryCodes = generateRecoveryCodes()
  const newRecoveryCodesBlob = encryptRecoveryCodes(newRecoveryCodes, updatedPayload)

  await cryptoApi.uploadKeyBackup({
    encrypted_blob: toBase64(encryptedBlob),
    salt: toBase64(salt),
    nonce: toBase64(new Uint8Array(0)),
    recovery_codes: toBase64(newRecoveryCodesBlob),
  })

  const identityPublicKey = fromBase64(
    (await cryptoApi.getIdentityKey(userId)).public_key,
  )

  await keyStore.saveIdentityKeys(userId, {
    id: 'current',
    publicKey: identityPublicKey,
    privateKey: payload.identityPrivateKey,
  })
  await keyStore.saveDeviceKeys(userId, {
    id: 'current',
    deviceId: device.id,
    publicKey: deviceKeyPair.publicKey,
    privateKey: deviceKeyPair.privateKey,
  })
  await keyStore.saveRecoveryCodes(userId, newRecoveryCodes)

  const store = useCryptoStore.getState()
  store.setDeviceId(device.id)
  store.setSetupStatus('setup')
  store.setUnlocked(true)

  return newRecoveryCodes
}
