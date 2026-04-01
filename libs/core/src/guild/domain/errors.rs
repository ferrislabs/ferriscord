use ferriscord_entities::{channel::ChannelId, guild::GuildId};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("guild with id {guild_id} not found")]
    GuildNotFound { guild_id: GuildId },

    #[error("channel with id {channel_id} not found")]
    ChannelNotFound { channel_id: ChannelId },

    #[error("parent channel is invalid: must be a Category in the same guild")]
    InvalidChannelParent,

    #[error("guild with id {guild_id} already exists")]
    GuildAlreadyExists { guild_id: GuildId },

    #[error("guild slug '{slug}' already exists")]
    GuildSlugAlreadyExists { slug: String },

    #[error("maximum number of guilds reached: {max_guilds}")]
    MaxGuildsReached { max_guilds: usize },

    #[error("infrastructure database setup error: {details}")]
    InfrastructureDatabaseSetupError { details: String },

    #[error("unknown error: {message}")]
    Unknown { message: String },

    #[error("insufficient permissions to perform this action")]
    InsufficientPermissions,

    #[error("invite not found")]
    InviteNotFound,

    #[error("invite has expired")]
    InviteExpired,

    #[error("invite has reached its maximum number of uses")]
    InviteMaxUsesReached,
}

impl From<&str> for CoreError {
    fn from(message: &str) -> Self {
        match message {
            "Insufficient permissions" => CoreError::InsufficientPermissions,
            _ => CoreError::Unknown {
                message: message.to_string(),
            },
        }
    }
}
