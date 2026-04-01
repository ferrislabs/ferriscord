use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

// ─── Device ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct DeviceInfo {
    pub id: Uuid,
    pub device_name: String,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
    pub created_at: DateTime<Utc>,
    pub last_seen_at: DateTime<Utc>,
}

// ─── Key Bundle (returned when initiating a DM session) ─────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct KeyBundle {
    pub user_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub identity_key: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub signed_prekey: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub signed_prekey_signature: Vec<u8>,
    #[serde(with = "option_base64_bytes")]
    #[schema(value_type = Option<String>, format = "byte")]
    pub onetime_prekey: Option<Vec<u8>>,
    /// ID of the consumed one-time pre-key (so the client can identify which one was used)
    pub onetime_prekey_id: Option<Uuid>,
}

// ─── Identity Key ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct IdentityKeyInfo {
    pub user_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
    pub created_at: DateTime<Utc>,
}

// ─── Key Backup ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct KeyBackup {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_blob: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub salt: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub nonce: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub recovery_codes: Vec<u8>,
    pub version: i32,
}

// ─── Sender Key ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct SenderKeyDistribution {
    pub sender_key_id: Uuid,
    pub sender_user_id: Uuid,
    pub channel_id: Uuid,
    pub generation: i32,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_key: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub nonce: Vec<u8>,
}

// ─── DM Session ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct DmSessionInfo {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub device_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_ratchet_state: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub ephemeral_public_key: Vec<u8>,
    pub generation: i32,
}

// ─── Request types ───────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, ToSchema)]
pub struct UploadIdentityKeyRequest {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RegisterDeviceRequest {
    pub device_name: String,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UploadSignedPreKeyRequest {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub signature: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UploadOneTimePreKeysRequest {
    pub prekeys: Vec<OneTimePreKeyUpload>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct OneTimePreKeyUpload {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub public_key: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UploadKeyBackupRequest {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_blob: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub salt: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub nonce: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub recovery_codes: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct DistributeSenderKeyRequest {
    pub generation: i32,
    pub distributions: Vec<SenderKeyDistributionUpload>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SenderKeyDistributionUpload {
    pub recipient_device_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_key: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub nonce: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateDmSessionRequest {
    pub device_id: Uuid,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_ratchet_state: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub ephemeral_public_key: Vec<u8>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateDmSessionRequest {
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub encrypted_ratchet_state: Vec<u8>,
    #[serde(with = "base64_bytes")]
    #[schema(value_type = String, format = "byte")]
    pub ephemeral_public_key: Vec<u8>,
}

// ─── base64 serde helpers ────────────────────────────────────────────────────

mod base64_bytes {
    use base64::{Engine, engine::general_purpose::STANDARD};
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(bytes: &Vec<u8>, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&STANDARD.encode(bytes))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<u8>, D::Error> {
        let s = String::deserialize(d)?;
        STANDARD.decode(s).map_err(serde::de::Error::custom)
    }
}

mod option_base64_bytes {
    use base64::{Engine, engine::general_purpose::STANDARD};
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(bytes: &Option<Vec<u8>>, s: S) -> Result<S::Ok, S::Error> {
        match bytes {
            Some(b) => s.serialize_some(&STANDARD.encode(b)),
            None => s.serialize_none(),
        }
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Vec<u8>>, D::Error> {
        let opt: Option<String> = Option::deserialize(d)?;
        match opt {
            Some(s) => STANDARD.decode(s).map(Some).map_err(serde::de::Error::custom),
            None => Ok(None),
        }
    }
}
