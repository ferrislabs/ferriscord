use ferriscord_auth::AuthRepository;

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::{
        entities::{CreateGuildInput, Guild},
        ports::{GuildPort, GuildService},
    },
};

impl<G, A> GuildService for Service<G, A>
where
    G: GuildPort,
    A: AuthRepository,
{
    async fn create_guild(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        let guilds = self.guild_repository.list_by_owner(&input.owner_id).await?;

        if guilds.len() >= 10 {
            return Err(CoreError::MaxGuildsReached { max_guilds: 10 });
        }

        let guild = self.guild_repository.insert(input).await?;

        Ok(guild)
    }
}
