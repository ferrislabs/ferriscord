use ferriscord_auth::Identity;
use ferriscord_entities::{
    guild::{Guild, GuildId, OwnerId},
    user::UserId,
};

use crate::guild::domain::{
    errors::CoreError,
    guild::{
        entities::CreateGuildInput,
        ports::{GuildPort, GuildService},
    },
    member::ports::MemberRepository,
    role::ports::RoleRepository,
};

#[derive(Clone)]
pub struct GuildServiceImpl<G, R, M>
where
    G: GuildPort,
    R: RoleRepository,
    M: MemberRepository,
{
    pub(crate) guild_repository: G,
    pub(crate) role_repository: R,
    pub(crate) member_repository: M,
}

impl<G, R, M> GuildService for GuildServiceImpl<G, R, M>
where
    G: GuildPort,
    R: RoleRepository,
    M: MemberRepository,
{
    async fn create_guild(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        let guilds = self.guild_repository.list_by_owner(&input.owner_id).await?;

        if guilds.len() >= 10 {
            return Err(CoreError::MaxGuildsReached { max_guilds: 10 });
        }

        let owner_user_id = input.owner_user_id.clone();
        let guild = self.guild_repository.insert(input).await?;

        self.role_repository.insert("everyone", 0, 0, &guild.id).await?;

        self.member_repository.insert(&guild.id, &owner_user_id).await?;

        Ok(guild)
    }

    async fn delete_guild(&self, identity: Identity, guild_id: &GuildId) -> Result<(), CoreError> {
        let guild = self
            .guild_repository
            .find_by_id(guild_id)
            .await?
            .ok_or(CoreError::GuildNotFound { guild_id: guild_id.clone() })?;

        let owner_id: OwnerId = identity.id().into();

        if guild.owner_id != owner_id {
            return Err(CoreError::Unknown { message: "no owner".to_string() });
        }

        self.guild_repository.delete(guild_id).await?;

        Ok(())
    }

    async fn get_user_guilds(
        &self,
        _identity: Identity,
        user_id: UserId,
    ) -> Result<Vec<Guild>, CoreError> {
        self.guild_repository.list_by_member(&user_id).await
    }

    async fn leave_guild(
        &self,
        identity: Identity,
        guild_id: &GuildId,
        user_id: UserId,
    ) -> Result<(), CoreError> {
        let guild = self
            .guild_repository
            .find_by_id(guild_id)
            .await?
            .ok_or(CoreError::GuildNotFound { guild_id: guild_id.clone() })?;

        let owner_id: OwnerId = identity.id().into();

        if guild.owner_id == owner_id {
            return Err(CoreError::Unknown {
                message: "owner cannot leave the guild".to_string(),
            });
        }

        self.member_repository.delete_member(guild_id, &user_id).await?;

        Ok(())
    }
}
