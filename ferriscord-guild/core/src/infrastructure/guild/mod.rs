use crate::{
    domain::{
        errors::CoreError,
        guild::{
            entities::{CreateGuildInput, Guild, GuildId, OwnerId},
            ports::GuildPort,
        },
    },
    infrastructure::guild::postgres::PostgresGuildRepository,
};

pub mod postgres;

pub enum GuildRepository {
    Postgres(PostgresGuildRepository),
}

impl GuildPort for GuildRepository {
    async fn find_by_id(&self, id: &GuildId) -> Result<Option<Guild>, CoreError> {
        match self {
            GuildRepository::Postgres(repo) => repo.find_by_id(id).await,
        }
    }

    async fn insert(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        match self {
            GuildRepository::Postgres(repo) => repo.insert(input).await,
        }
    }

    async fn list_by_owner(&self, owner_id: &OwnerId) -> Result<Vec<Guild>, CoreError> {
        match self {
            GuildRepository::Postgres(repo) => repo.list_by_owner(owner_id).await,
        }
    }
}
