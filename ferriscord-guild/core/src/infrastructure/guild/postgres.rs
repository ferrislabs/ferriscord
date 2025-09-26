use sqlx::PgPool;

use crate::domain::{
    errors::CoreError,
    guild::{
        entities::{CreateGuildInput, Guild, GuildId, OwnerId},
        ports::GuildPort,
    },
};

pub struct PostgresGuildRepository {
    #[allow(dead_code)]
    pool: PgPool,
}

impl PostgresGuildRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl GuildPort for PostgresGuildRepository {
    async fn find_by_id(&self, _id: &GuildId) -> Result<Option<Guild>, CoreError> {
        todo!()
    }

    async fn insert(&self, _input: CreateGuildInput) -> Result<Guild, CoreError> {
        todo!()
    }

    async fn list_by_owner(&self, _owner_id: &OwnerId) -> Result<Vec<Guild>, CoreError> {
        todo!()
    }
}
