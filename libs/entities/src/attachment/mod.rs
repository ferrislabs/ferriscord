use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::Id;

// ─── AttachmentId ─────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema)]
pub struct AttachmentId(pub Id);

impl AttachmentId {
    pub fn new() -> Self {
        Self(Id::new())
    }

    pub fn get_uuid(&self) -> Uuid {
        self.0.get_uuid()
    }
}

impl Default for AttachmentId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for AttachmentId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

// ─── Attachment ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct Attachment {
    pub id: AttachmentId,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    /// S3 key — never serialized in API responses.
    #[serde(skip_serializing)]
    pub storage_key: String,
    /// Pre-signed or public URL, populated by the handler.
    pub url: String,
    pub encrypted: bool,
    pub created_at: DateTime<Utc>,
}
