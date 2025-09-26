use crate::{
    application::policies::Policies,
    domain::{Config, errors::CoreError},
    infrastructure::{common::build_repos_from_conf, guild::GuildRepository},
};

mod guild;
mod policies;

pub struct FerrisCordService {
    pub(crate) guild_repository: GuildRepository,
    #[allow(dead_code)]
    pub(crate) policies: Policies,
}

impl FerrisCordService {
    pub async fn new(conf: &Config) -> Result<Self, CoreError> {
        let repos = build_repos_from_conf(conf).await?;

        Ok(Self {
            guild_repository: repos.guild_repository,
            policies: Policies::new(),
        })
    }
}
