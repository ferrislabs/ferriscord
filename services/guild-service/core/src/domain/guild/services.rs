use ferriscord_auth::{AuthRepository, Identity};

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::{
        entities::{CreateGuildInput, Guild, GuildId, OwnerId},
        ports::{GuildPort, GuildService},
    },
    role::ports::RoleRepository,
};

impl<G, A, R> GuildService for Service<G, A, R>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
{
    async fn create_guild(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        let guilds = self.guild_repository.list_by_owner(&input.owner_id).await?;

        if guilds.len() >= 10 {
            return Err(CoreError::MaxGuildsReached { max_guilds: 10 });
        }

        let guild = self.guild_repository.insert(input).await?;

        // create default roles
        // create member profile for owner
        // create default channels

        Ok(guild)
    }

    async fn delete_guild(&self, identity: Identity, guild_id: &GuildId) -> Result<(), CoreError> {
        let guild =
            self.guild_repository
                .find_by_id(guild_id)
                .await?
                .ok_or(CoreError::GuildNotFound {
                    guild_id: guild_id.clone(),
                })?;

        let owner_id: OwnerId = identity.id().into();

        if guild.owner_id != owner_id {
            return Err(CoreError::Unknown {
                message: "no owner".to_string(),
            });
        }

        self.guild_repository.delete(guild_id).await?;

        Ok(())
    }
}
