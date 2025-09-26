use crate::{
    application::FerrisCordService,
    domain::{
        errors::CoreError,
        guild::{
            entities::{CreateGuildInput, Guild},
            ports::{GuildPort, GuildService},
        },
    },
};

impl GuildService for FerrisCordService {
    async fn create_guild(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        let guilds = self.guild_repository.list_by_owner(&input.owner_id).await?;

        if guilds.len() >= 10 {
            return Err(CoreError::MaxGuildsReached { max_guilds: 10 });
        }

        let guild = self.guild_repository.insert(input).await?;

        Ok(guild)
    }
}
