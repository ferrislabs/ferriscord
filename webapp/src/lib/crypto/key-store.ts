/**
 * IndexedDB-based local key storage for E2EE.
 *
 * Database per user: `ferriscord_crypto_{userId}`
 * Stores:
 *   - identity_keys:   { id: 'current', publicKey, privateKey }
 *   - device_keys:     { id: 'current', deviceId, publicKey, privateKey }
 *   - signed_prekey:   { id: 'current', publicKey, privateKey }
 *   - onetime_prekeys: { id: serverId, publicKey, privateKey }
 *   - dm_sessions:     { id: channelId, ratchetState, generation }
 *   - sender_keys:     { id: channelId:userId, senderKey, generation }
 *   - recovery_codes:  { id: 'current', codes: string[] }
 *   - sent_messages:   { id: messageId, plaintext }
 */

const DB_VERSION = 3

const STORES = [
  'identity_keys',
  'device_keys',
  'signed_prekey',
  'onetime_prekeys',
  'dm_sessions',
  'sender_keys',
  'recovery_codes',
  'sent_messages',
] as const

type StoreName = (typeof STORES)[number]

function dbName(userId: string): string {
  return `ferriscord_crypto_${userId}`
}

function openDb(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName(userId), DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' })
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function get<T>(userId: string, store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDb(userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

async function put<T>(userId: string, store: StoreName, value: T): Promise<void> {
  const db = await openDb(userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function del(userId: string, store: StoreName, key: string): Promise<void> {
  const db = await openDb(userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function getAll<T>(userId: string, store: StoreName): Promise<T[]> {
  const db = await openDb(userId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

// ─── Typed Interfaces ────────────────────────────────────────────────────────

export interface StoredIdentityKeys {
  id: 'current'
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface StoredDeviceKeys {
  id: 'current'
  deviceId: string
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface StoredSignedPreKey {
  id: 'current'
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface StoredOneTimePreKey {
  id: string // server-assigned UUID
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface StoredDmSession {
  id: string // channelId
  ratchetState: Uint8Array
  generation: number
}

export interface StoredSenderKey {
  id: string // `${channelId}:${userId}`
  senderKey: Uint8Array
  generation: number
}

export interface StoredRecoveryCodes {
  id: 'current'
  codes: string[]
}

export interface StoredSentMessage {
  id: string // messageId or `ciphertext:${base64}`
  plaintext: string
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const keyStore = {
  // Identity keys
  getIdentityKeys: (userId: string) =>
    get<StoredIdentityKeys>(userId, 'identity_keys', 'current'),

  saveIdentityKeys: (userId: string, keys: StoredIdentityKeys) =>
    put(userId, 'identity_keys', keys),

  // Device keys
  getDeviceKeys: (userId: string) =>
    get<StoredDeviceKeys>(userId, 'device_keys', 'current'),

  saveDeviceKeys: (userId: string, keys: StoredDeviceKeys) =>
    put(userId, 'device_keys', keys),

  // Signed pre-key
  getSignedPreKey: (userId: string) =>
    get<StoredSignedPreKey>(userId, 'signed_prekey', 'current'),

  saveSignedPreKey: (userId: string, key: StoredSignedPreKey) =>
    put(userId, 'signed_prekey', key),

  // One-time pre-keys
  getOneTimePreKey: (userId: string, serverId: string) =>
    get<StoredOneTimePreKey>(userId, 'onetime_prekeys', serverId),

  saveOneTimePreKey: (userId: string, key: StoredOneTimePreKey) =>
    put(userId, 'onetime_prekeys', key),

  deleteOneTimePreKey: (userId: string, serverId: string) =>
    del(userId, 'onetime_prekeys', serverId),

  // DM sessions
  getDmSession: (userId: string, channelId: string) =>
    get<StoredDmSession>(userId, 'dm_sessions', channelId),

  saveDmSession: (userId: string, session: StoredDmSession) =>
    put(userId, 'dm_sessions', session),

  deleteDmSession: (userId: string, channelId: string) =>
    del(userId, 'dm_sessions', channelId),

  // Sender keys
  getSenderKey: (userId: string, channelId: string, senderUserId: string) =>
    get<StoredSenderKey>(userId, 'sender_keys', `${channelId}:${senderUserId}`),

  saveSenderKey: (userId: string, key: StoredSenderKey) =>
    put(userId, 'sender_keys', key),

  getAllSenderKeys: (userId: string) =>
    getAll<StoredSenderKey>(userId, 'sender_keys'),

  deleteSenderKey: (userId: string, channelId: string, senderUserId: string) =>
    del(userId, 'sender_keys', `${channelId}:${senderUserId}`),

  // Recovery codes
  getRecoveryCodes: (userId: string) =>
    get<StoredRecoveryCodes>(userId, 'recovery_codes', 'current'),

  saveRecoveryCodes: (userId: string, codes: string[]) =>
    put(userId, 'recovery_codes', { id: 'current' as const, codes }),

  // Sent messages (persistent plaintext cache for own encrypted messages)
  getSentMessage: (userId: string, messageId: string) =>
    get<StoredSentMessage>(userId, 'sent_messages', messageId),

  saveSentMessage: (userId: string, messageId: string, plaintext: string) =>
    put(userId, 'sent_messages', { id: messageId, plaintext }),

  getSentMessageByCiphertext: (userId: string, ciphertext: string) =>
    get<StoredSentMessage>(userId, 'sent_messages', `ciphertext:${ciphertext}`),

  saveSentMessageByCiphertext: (userId: string, ciphertext: string, plaintext: string) =>
    put(userId, 'sent_messages', { id: `ciphertext:${ciphertext}`, plaintext }),

  // Check if E2EE is set up for this user
  async isSetUp(userId: string): Promise<boolean> {
    const identity = await this.getIdentityKeys(userId)
    const device = await this.getDeviceKeys(userId)
    return !!identity && !!device
  },

  // Wipe all keys for a user (used on logout or key reset)
  async clear(userId: string): Promise<void> {
    const name = dbName(userId)
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },
}
