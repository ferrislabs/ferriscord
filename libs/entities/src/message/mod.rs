use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{attachment::Attachment, channel::ChannelId, user::UserId, Id};

// ─── MessageId ───────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema)]
pub struct MessageId(pub Id);

impl MessageId {
    pub fn new() -> Self {
        Self(Id::new())
    }

    pub fn get_uuid(&self) -> Uuid {
        self.0.get_uuid()
    }
}

impl Default for MessageId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for MessageId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

// ─── MessageAuthor ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct MessageAuthor {
    pub id: UserId,
    pub username: String,
    pub avatar_url: Option<String>,
}

// ─── Message ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct Message {
    pub id: MessageId,
    pub channel_id: ChannelId,
    pub author: MessageAuthor,
    pub content: String,
    pub attachments: Vec<Attachment>,
    pub edited_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
