use thiserror::Error;

use crate::domain::guild::entities::GuildId;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("guild with id {guild_id} not found")]
    GuildNotFound { guild_id: GuildId },

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
}
