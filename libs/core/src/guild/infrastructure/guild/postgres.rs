use chrono::{DateTime, Utc};
use ferriscord_entities::{
    Id,
    guild::{Guild, GuildId, OwnerId},
    user::UserId,
};
use sqlx::{PgPool, query, query_as};
use tracing::{debug, error};
use uuid::Uuid;

use crate::guild::domain::{
    errors::CoreError,
    guild::{entities::{CreateGuildInput, UpdateGuildInput}, ports::GuildPort},
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
    icon_url: Option<String>,
    banner_url: Option<String>,
    banner_color: Option<String>,
    created_at: DateTime<Utc>,
}

impl From<GuildRow> for Guild {
    fn from(row: GuildRow) -> Self {
        Guild {
            id: GuildId(Id(row.id)),
            name: row.name,
            slug: row.slug,
            owner_id: OwnerId(Id(row.owner_id)),
            icon_url: row.icon_url,
            banner_url: row.banner_url,
            banner_color: row.banner_color,
            created_at: row.created_at,
        }
    }
}

impl GuildPort for PostgresGuildRepository {
    async fn find_by_id(&self, id: &GuildId) -> Result<Option<Guild>, CoreError> {
        debug!("finding guild by id: {}", id);

        let row = query_as!(
            GuildRow,
            "SELECT id, name, slug, owner_id, icon_url, banner_url, banner_color, created_at FROM guilds WHERE id = $1",
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

            if let Some(db_err) = e.as_database_error()
                && db_err.constraint() == Some("guilds_slug_key")
            {
                return CoreError::GuildSlugAlreadyExists { slug: input.name };
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
            "SELECT id, name, slug, owner_id, icon_url, banner_url, banner_color, created_at FROM guilds WHERE owner_id = $1",
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

    async fn list_by_member(&self, user_id: &UserId) -> Result<Vec<Guild>, CoreError> {
        let rows = query_as!(
            GuildRow,
            r#"SELECT g.id, g.name, g.slug, g.owner_id, g.icon_url, g.banner_url, g.banner_color, g.created_at
               FROM guilds g
               INNER JOIN members m ON m.guild_id = g.id
               WHERE m.user_id = $1"#,
            user_id.get_uuid()
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list guilds for member {}: {}", user_id, e);
            CoreError::Unknown {
                message: format!("Failed to list guilds by member: {}", e),
            }
        })?;

        Ok(rows.into_iter().map(Guild::from).collect())
    }

    async fn delete(&self, guild_id: &GuildId) -> Result<(), CoreError> {
        query!("DELETE FROM guilds WHERE id = $1", guild_id.get_uuid())
            .execute(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to delete guild: {}", e);
                CoreError::Unknown {
                    message: e.to_string(),
                }
            })?;

        Ok(())
    }

    async fn update(&self, input: UpdateGuildInput) -> Result<Guild, CoreError> {
        let row = query_as!(
            GuildRow,
            r#"UPDATE guilds
               SET
                 name        = COALESCE($2, name),
                 slug        = COALESCE(LOWER(REPLACE($2, ' ', '-')), slug),
                 icon_url    = COALESCE($3, icon_url),
                 banner_url  = COALESCE($4, banner_url),
                 banner_color = COALESCE($5, banner_color)
               WHERE id = $1
               RETURNING id, name, slug, owner_id, icon_url, banner_url, banner_color, created_at"#,
            input.guild_id.get_uuid(),
            input.name,
            input.icon_url,
            input.banner_url,
            input.banner_color,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to update guild: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        Ok(Guild::from(row))
    }
}
