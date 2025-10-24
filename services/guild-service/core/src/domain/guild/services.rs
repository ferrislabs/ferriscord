use ferriscord_auth::AuthRepository;

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::{
        entities::{CreateGuildInput, Guild},
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
}
