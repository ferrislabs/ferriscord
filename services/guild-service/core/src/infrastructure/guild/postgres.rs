use chrono::{DateTime, Utc};
use sqlx::{PgPool, query, query_as};
use tracing::{debug, error};
use uuid::Uuid;

use crate::domain::{
    Id,
    errors::CoreError,
    guild::{
        entities::{CreateGuildInput, Guild, GuildId, OwnerId},
        ports::GuildPort,
    },
};

#[derive(Clone)]
pub struct PostgresGuildRepository {
    #[allow(dead_code)]
    pool: PgPool,
}

impl PostgresGuildRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
#[derive(sqlx::FromRow)]
struct GuildRow {
    id: Uuid,
    name: String,
    slug: String,
    owner_id: Uuid,
    created_at: DateTime<Utc>,
}

impl From<GuildRow> for Guild {
    fn from(row: GuildRow) -> Self {
        Guild {
            id: GuildId(Id(row.id)),
            name: row.name,
            slug: row.slug,
            owner_id: OwnerId(Id(row.owner_id)),
            created_at: row.created_at,
        }
    }
}

impl GuildPort for PostgresGuildRepository {
    async fn find_by_id(&self, id: &GuildId) -> Result<Option<Guild>, CoreError> {
        debug!("finding guild by id: {}", id);

        let row = query_as!(
            GuildRow,
            "SELECT id, name, slug, owner_id, created_at FROM guilds WHERE id = $1",
            id.get_uuid()
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|_| CoreError::GuildNotFound {
            guild_id: id.clone(),
        })?;

        Ok(row.map(Guild::from))
    }

    async fn insert(&self, input: CreateGuildInput) -> Result<Guild, CoreError> {
        let guild = Guild::new(input.name.clone(), input.owner_id);

        query!(
            r#"
            INSERT INTO guilds (id, name, slug, owner_id, created_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            guild.id.get_uuid(),
            guild.name,
            guild.slug,
            guild.owner_id.get_uuid(),
            guild.created_at,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to insert guild: {}", e);

            if let Some(db_err) = e.as_database_error() {
                if db_err.constraint() == Some("guilds_slug_key") {
                    return CoreError::GuildSlugAlreadyExists { slug: input.name };
                }
            }

            CoreError::Unknown {
                message: e.to_string(),
            }
        })?;

        Ok(guild)
    }

    async fn list_by_owner(&self, owner_id: &OwnerId) -> Result<Vec<Guild>, CoreError> {
        let rows = query_as!(
            GuildRow,
            "SELECT id, name, slug, owner_id, created_at FROM guilds WHERE owner_id = $1",
            owner_id.get_uuid()
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to list guilds for owner {}: {}", owner_id.0, e);
            CoreError::Unknown {
                message: format!("Failed to list guilds by owner: {}", e),
            }
        })?;

        let guilds: Vec<Guild> = rows.into_iter().map(Guild::from).collect();

        Ok(guilds)
    }
}
