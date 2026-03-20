use chrono::{DateTime, Utc};
use ferriscord_entities::{guild::GuildId, user::UserId};
use uuid::Uuid;

use crate::guild::domain::errors::CoreError;

pub struct MemberWithUser {
    pub member_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub joined_at: DateTime<Utc>,
}

pub trait MemberRepository: Send + Sync {
    fn insert(
        &self,
        guild_id: &GuildId,
        user_id: &UserId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn list_members(
        &self,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Vec<MemberWithUser>, CoreError>> + Send;

    fn delete_member(
        &self,
        guild_id: &GuildId,
        user_id: &UserId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
}
