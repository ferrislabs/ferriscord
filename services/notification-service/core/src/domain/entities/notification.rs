use chrono::{DateTime, Utc};
use ferriscord_domain::{ChannelId, NotificationId, UserId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Notification {
    pub id: NotificationId,
    pub user_id: UserId,
    pub title: String,
    pub content: String,
    pub channel_id: Option<ChannelId>,
    pub kind: NotificationKind,
    pub created_at: DateTime<Utc>,
    pub read: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotificationKind {
    MessageReceived,
    FriendRequest,
    FriendAccepted,
    SystemAlert,
}
