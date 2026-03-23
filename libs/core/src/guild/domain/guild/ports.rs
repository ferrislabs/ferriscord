use ferriscord_auth::Identity;
use ferriscord_entities::{
    guild::{Guild, GuildId, OwnerId},
    user::UserId,
};

use crate::guild::domain::{errors::CoreError, guild::entities::{CreateGuildInput, UpdateGuildInput}};

pub trait GuildPort: Send + Sync {
    fn insert(
        &self,
        input: CreateGuildInput,
    ) -> impl Future<Output = Result<Guild, CoreError>> + Send;
    fn find_by_id(
        &self,
        id: &GuildId,
    ) -> impl Future<Output = Result<Option<Guild>, CoreError>> + Send;
    fn list_by_owner(
        &self,
        owner_id: &OwnerId,
    ) -> impl Future<Output = Result<Vec<Guild>, CoreError>> + Send;
    fn list_by_member(
        &self,
        user_id: &UserId,
    ) -> impl Future<Output = Result<Vec<Guild>, CoreError>> + Send;
    fn delete(&self, guild_id: &GuildId) -> impl Future<Output = Result<(), CoreError>> + Send;
    fn update(
        &self,
        input: UpdateGuildInput,
    ) -> impl Future<Output = Result<Guild, CoreError>> + Send;
}

pub trait GuildService: Send + Sync {
    fn create_guild(
        &self,
        input: CreateGuildInput,
    ) -> impl Future<Output = Result<Guild, CoreError>> + Send;
    fn delete_guild(
        &self,
        identity: Identity,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
    fn get_user_guilds(
        &self,
        identity: Identity,
        user_id: UserId,
    ) -> impl Future<Output = Result<Vec<Guild>, CoreError>> + Send;

    fn leave_guild(
        &self,
        identity: Identity,
        guild_id: &GuildId,
        user_id: UserId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn update_guild(
        &self,
        identity: Identity,
        input: UpdateGuildInput,
    ) -> impl Future<Output = Result<Guild, CoreError>> + Send;
}
