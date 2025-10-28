use std::collections::HashMap;

use chrono::{DateTime, Utc};
use ferriscord_domain::{ChannelId, GuildId, NotificationId, UserId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum NotificationPriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub enum NotificationType {
    MessageReceived,
    MessageUpdated,
    MessageDeleted,
    DirectMessage,
    UserMentioned,

    TypingStarted,
    TypingEnded,
}

impl NotificationType {
    pub fn priority(&self) -> NotificationPriority {
        match self {
            NotificationType::DirectMessage => NotificationPriority::High,
            NotificationType::UserMentioned => NotificationPriority::High,
            NotificationType::MessageReceived => NotificationPriority::Medium,
            _ => NotificationPriority::Medium,
        }
    }

    pub fn is_real_time(&self) -> bool {
        matches!(
            self,
            NotificationType::TypingStarted | NotificationType::TypingEnded
        )
    }

    pub fn requires_persistence(&self) -> bool {
        !self.is_real_time()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Notification {
    id: NotificationId,
    pub notification_type: NotificationType,
    pub recipient: UserId,
    pub content: NotificationContent,
    pub contextn: NotificationContext,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct NotificationContext {
    pub guild_id: Option<GuildId>,
    pub channel_id: Option<ChannelId>,
    pub related_user_id: Option<UserId>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct NotificationContent {
    pub title: Option<String>,
    pub body: String,
    data: HashMap<String, serde_json::Value>,
}

impl NotificationContent {
    pub fn new(body: String) -> Result<Self, String> {
        if body.trim().is_empty() {
            return Err("Notification body cannot be empty".to_string());
        }

        Ok(Self {
            title: None,
            body,
            data: HashMap::new(),
        })
    }

    pub fn with_title(mut self, title: String) -> Self {
        self.title = Some(title);
        self
    }

    pub fn with_data(mut self, key: String, value: serde_json::Value) -> Self {
        self.data.insert(key, value);
        self
    }

    pub fn title(&self) -> Option<&String> {
        self.title.as_ref()
    }

    pub fn body(&self) -> &String {
        &self.body
    }

    pub fn data(&self) -> &HashMap<String, serde_json::Value> {
        &self.data
    }
}
