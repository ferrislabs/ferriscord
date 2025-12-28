use ferriscord_auth::Identity;
use ferriscord_entities::guild::{Guild, GuildId, OwnerId};

use crate::domain::{errors::CoreError, guild::entities::CreateGuildInput};

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
    fn delete(&self, guild_id: &GuildId) -> impl Future<Output = Result<(), CoreError>> + Send;
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
}
