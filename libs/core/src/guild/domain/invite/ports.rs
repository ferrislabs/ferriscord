use std::future::Future;

use ferriscord_entities::{guild::GuildId, invite::Invite};
use uuid::Uuid;

use crate::guild::domain::errors::CoreError;

pub trait InviteRepository: Send + Sync {
    fn insert(
        &self,
        guild_id: &GuildId,
        creator_sub: &str,
        expires_in_hours: Option<u32>,
        max_uses: Option<u32>,
    ) -> impl Future<Output = Result<Invite, CoreError>> + Send;

    fn find_by_code(
        &self,
        code: &str,
    ) -> impl Future<Output = Result<Option<Invite>, CoreError>> + Send;

    fn list_by_guild(
        &self,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Vec<Invite>, CoreError>> + Send;

    fn delete(
        &self,
        invite_id: Uuid,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn increment_uses(
        &self,
        invite_id: Uuid,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
}

pub trait InviteService: Send + Sync {
    fn create(
        &self,
        caller_sub: &str,
        guild_id: &GuildId,
        expires_in_hours: Option<u32>,
        max_uses: Option<u32>,
    ) -> impl Future<Output = Result<Invite, CoreError>> + Send;

    fn list(
        &self,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Vec<Invite>, CoreError>> + Send;

    fn delete(
        &self,
        invite_id: Uuid,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn join_by_code(
        &self,
        caller_sub: &str,
        caller_user_id: &ferriscord_entities::user::UserId,
        code: &str,
    ) -> impl Future<Output = Result<ferriscord_entities::guild::Guild, CoreError>> + Send;

    fn preview_by_code(
        &self,
        code: &str,
    ) -> impl Future<Output = Result<(Invite, ferriscord_entities::guild::Guild), CoreError>> + Send;
}
