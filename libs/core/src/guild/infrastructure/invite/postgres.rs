use chrono::{DateTime, Duration, Utc};
use ferriscord_entities::{Id, guild::{GuildId, OwnerId}, invite::Invite};
use rand::distributions::{Alphanumeric, DistString};
use sqlx::{PgPool, query, query_as};
use tracing::error;
use uuid::Uuid;

use crate::guild::domain::{errors::CoreError, invite::ports::InviteRepository};

#[derive(Clone)]
pub struct PostgresInviteRepository {
    pool: PgPool,
}

impl PostgresInviteRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct InviteRow {
    id: Uuid,
    guild_id: Uuid,
    code: String,
    creator_sub: String,
    expires_at: Option<DateTime<Utc>>,
    max_uses: Option<i32>,
    uses: i32,
    created_at: DateTime<Utc>,
}

impl From<InviteRow> for Invite {
    fn from(row: InviteRow) -> Self {
        Invite {
            id: row.id,
            guild_id: GuildId(ferriscord_entities::Id(row.guild_id)),
            code: row.code,
            creator_sub: row.creator_sub,
            expires_at: row.expires_at,
            max_uses: row.max_uses,
            uses: row.uses,
            created_at: row.created_at,
        }
    }
}

fn generate_code() -> String {
    Alphanumeric.sample_string(&mut rand::thread_rng(), 8)
}

impl InviteRepository for PostgresInviteRepository {
    async fn insert(
        &self,
        guild_id: &GuildId,
        creator_sub: &str,
        expires_in_hours: Option<u32>,
        max_uses: Option<u32>,
    ) -> Result<Invite, CoreError> {
        let id = Uuid::now_v7();
        let code = generate_code();
        let expires_at = expires_in_hours
            .map(|h| Utc::now() + Duration::hours(h as i64));
        let max_uses_i32 = max_uses.map(|u| u as i32);

        query!(
            r#"
            INSERT INTO invites (id, guild_id, code, creator_sub, expires_at, max_uses, uses, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 0, now())
            "#,
            id,
            guild_id.get_uuid(),
            code,
            creator_sub,
            expires_at,
            max_uses_i32,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to insert invite: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        let row = query_as!(
            InviteRow,
            "SELECT id, guild_id, code, creator_sub, expires_at, max_uses, uses, created_at FROM invites WHERE id = $1",
            id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown { message: e.to_string() })?;

        Ok(Invite::from(row))
    }

    async fn find_by_code(&self, code: &str) -> Result<Option<Invite>, CoreError> {
        let row = query_as!(
            InviteRow,
            "SELECT id, guild_id, code, creator_sub, expires_at, max_uses, uses, created_at FROM invites WHERE code = $1",
            code
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown { message: e.to_string() })?;

        Ok(row.map(Invite::from))
    }

    async fn list_by_guild(&self, guild_id: &GuildId) -> Result<Vec<Invite>, CoreError> {
        let rows = query_as!(
            InviteRow,
            "SELECT id, guild_id, code, creator_sub, expires_at, max_uses, uses, created_at FROM invites WHERE guild_id = $1 ORDER BY created_at DESC",
            guild_id.get_uuid()
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list invites: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        Ok(rows.into_iter().map(Invite::from).collect())
    }

    async fn delete(&self, invite_id: Uuid, guild_id: &GuildId) -> Result<(), CoreError> {
        query!(
            "DELETE FROM invites WHERE id = $1 AND guild_id = $2",
            invite_id,
            guild_id.get_uuid()
        )
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to delete invite: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        Ok(())
    }

    async fn increment_uses(&self, invite_id: Uuid) -> Result<(), CoreError> {
        query!("UPDATE invites SET uses = uses + 1 WHERE id = $1", invite_id)
            .execute(&self.pool)
            .await
            .map_err(|e| CoreError::Unknown { message: e.to_string() })?;

        Ok(())
    }
}
