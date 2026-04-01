use std::future::Future;

use ferriscord_entities::crypto::{
    DeviceInfo, DmSessionInfo, IdentityKeyInfo, KeyBackup, KeyBundle, SenderKeyDistribution,
};
use uuid::Uuid;

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("not found")]
    NotFound,

    #[error("already exists")]
    AlreadyExists,

    #[error("no pre-keys available")]
    NoPreKeysAvailable,

    #[error("internal error: {message}")]
    Internal { message: String },
}

/// Repository trait for all E2EE key storage operations.
/// The server is zero-knowledge: it stores and retrieves opaque blobs.
pub trait CryptoKeyRepository: Send + Sync {
    // ── Identity Keys ────────────────────────────────────────────────────

    fn upsert_identity_key(
        &self,
        user_id: Uuid,
        public_key: Vec<u8>,
    ) -> impl Future<Output = Result<(), CryptoError>> + Send;

    fn get_identity_key(
        &self,
        user_id: Uuid,
    ) -> impl Future<Output = Result<IdentityKeyInfo, CryptoError>> + Send;

    // ── Devices ──────────────────────────────────────────────────────────

    fn register_device(
        &self,
        user_id: Uuid,
        device_name: String,
        public_key: Vec<u8>,
    ) -> impl Future<Output = Result<DeviceInfo, CryptoError>> + Send;

    fn list_devices(
        &self,
        user_id: Uuid,
    ) -> impl Future<Output = Result<Vec<DeviceInfo>, CryptoError>> + Send;

    fn delete_device(
        &self,
        user_id: Uuid,
        device_id: Uuid,
    ) -> impl Future<Output = Result<bool, CryptoError>> + Send;

    fn touch_device(
        &self,
        device_id: Uuid,
    ) -> impl Future<Output = Result<(), CryptoError>> + Send;

    // ── Signed Pre-Keys ──────────────────────────────────────────────────

    fn upsert_signed_prekey(
        &self,
        device_id: Uuid,
        public_key: Vec<u8>,
        signature: Vec<u8>,
    ) -> impl Future<Output = Result<Uuid, CryptoError>> + Send;

    // ── One-Time Pre-Keys ────────────────────────────────────────────────

    /// Returns the server-assigned IDs for each uploaded prekey, in order.
    fn upload_onetime_prekeys(
        &self,
        device_id: Uuid,
        prekeys: Vec<Vec<u8>>,
    ) -> impl Future<Output = Result<Vec<Uuid>, CryptoError>> + Send;

    fn count_available_onetime_prekeys(
        &self,
        device_id: Uuid,
    ) -> impl Future<Output = Result<u32, CryptoError>> + Send;

    // ── Key Bundle ───────────────────────────────────────────────────────

    /// Fetches one bundle per device for the target user and consumes one OTP
    /// per device when available.
    fn fetch_key_bundles(
        &self,
        user_id: Uuid,
    ) -> impl Future<Output = Result<Vec<KeyBundle>, CryptoError>> + Send;

    // ── Key Backup ───────────────────────────────────────────────────────

    fn upsert_key_backup(
        &self,
        user_id: Uuid,
        encrypted_blob: Vec<u8>,
        salt: Vec<u8>,
        nonce: Vec<u8>,
        recovery_codes: Vec<u8>,
    ) -> impl Future<Output = Result<(), CryptoError>> + Send;

    fn get_key_backup(
        &self,
        user_id: Uuid,
    ) -> impl Future<Output = Result<KeyBackup, CryptoError>> + Send;

    // ── Sender Keys (Guild Channels) ─────────────────────────────────────

    fn distribute_sender_key(
        &self,
        channel_id: Uuid,
        sender_user_id: Uuid,
        sender_device_id: Uuid,
        generation: i32,
        distributions: Vec<(Uuid, Vec<u8>, Vec<u8>)>, // (recipient_device_id, encrypted_key, nonce)
    ) -> impl Future<Output = Result<(), CryptoError>> + Send;

    fn get_sender_keys_for_device(
        &self,
        channel_id: Uuid,
        device_id: Uuid,
    ) -> impl Future<Output = Result<Vec<SenderKeyDistribution>, CryptoError>> + Send;

    // ── DM Sessions ──────────────────────────────────────────────────────

    fn upsert_dm_session(
        &self,
        channel_id: Uuid,
        owner_device_id: Uuid,
        peer_device_id: Uuid,
        peer_user_id: Uuid,
        encrypted_ratchet_state: Vec<u8>,
        ephemeral_public_key: Vec<u8>,
    ) -> impl Future<Output = Result<DmSessionInfo, CryptoError>> + Send;

    fn get_dm_session(
        &self,
        channel_id: Uuid,
        owner_device_id: Uuid,
        peer_device_id: Uuid,
    ) -> impl Future<Output = Result<DmSessionInfo, CryptoError>> + Send;
}
