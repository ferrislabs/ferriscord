use chrono::{DateTime, Utc};
use ferriscord_domain::{ChannelId, ConnectionId, GuildId, NotificationId, UserId, UserStatus};

use crate::domain::entities::NotificationType;

#[derive(Debug, Clone, PartialEq)]
pub enum DomainEvent {
    NotificationCreated {
        notification_id: NotificationId,
        recipient: UserId,
        notification_type: NotificationType,
        created_at: DateTime<Utc>,
    },

    NotificationDelivered {
        notification_id: NotificationId,
        recipient: UserId,
        delivered_at: DateTime<Utc>,
    },
    NotificationRead {
        notification_id: NotificationId,
        recipient: UserId,
        read_at: DateTime<Utc>,
    },
    NotificationFailed {
        notification_id: NotificationId,
        recipient: UserId,
        reason: String,
        failed_at: DateTime<Utc>,
    },

    // Connection events
    UserConnected {
        user_id: UserId,
        connection_id: ConnectionId,
        connected_at: DateTime<Utc>,
    },
    UserDisconnected {
        user_id: UserId,
        connection_id: ConnectionId,
        disconnected_at: DateTime<Utc>,
    },

    // Presence events
    UserPresenceChanged {
        user_id: UserId,
        old_presence: UserStatus,
        new_presence: UserStatus,
        changed_at: DateTime<Utc>,
    },

    // External events that trigger notifications
    MessagePosted {
        message_id: String,
        channel_id: ChannelId,
        guild_id: Option<GuildId>,
        author_id: UserId,
        content: String,
        mentions: Vec<UserId>,
        posted_at: DateTime<Utc>,
    },
    TypingStarted {
        user_id: UserId,
        channel_id: ChannelId,
        guild_id: Option<GuildId>,
        started_at: DateTime<Utc>,
    },
    TypingEnded {
        user_id: UserId,
        channel_id: ChannelId,
        guild_id: Option<GuildId>,
        ended_at: DateTime<Utc>,
    },
}

impl DomainEvent {
    pub fn occurred_at(&self) -> DateTime<Utc> {
        match self {
            DomainEvent::NotificationCreated { created_at, .. } => *created_at,
            DomainEvent::NotificationDelivered { delivered_at, .. } => *delivered_at,
            DomainEvent::NotificationRead { read_at, .. } => *read_at,
            DomainEvent::NotificationFailed { failed_at, .. } => *failed_at,
            DomainEvent::UserConnected { connected_at, .. } => *connected_at,
            DomainEvent::UserDisconnected {
                disconnected_at, ..
            } => *disconnected_at,
            DomainEvent::UserPresenceChanged { changed_at, .. } => *changed_at,
            DomainEvent::MessagePosted { posted_at, .. } => *posted_at,
            DomainEvent::TypingStarted { started_at, .. } => *started_at,
            DomainEvent::TypingEnded { ended_at, .. } => *ended_at,
        }
    }

    pub fn event_type(&self) -> &'static str {
        match self {
            DomainEvent::NotificationCreated { .. } => "notification_created",
            DomainEvent::NotificationDelivered { .. } => "notification_delivered",
            DomainEvent::NotificationRead { .. } => "notification_read",
            DomainEvent::NotificationFailed { .. } => "notification_failed",
            DomainEvent::UserConnected { .. } => "user_connected",
            DomainEvent::UserDisconnected { .. } => "user_disconnected",
            DomainEvent::UserPresenceChanged { .. } => "user_presence_changed",
            DomainEvent::MessagePosted { .. } => "message_posted",
            DomainEvent::TypingStarted { .. } => "typing_started",
            DomainEvent::TypingEnded { .. } => "typing_ended",
        }
    }
}
