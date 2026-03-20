use chrono::{DateTime, Utc};
use ferriscord_entities::{Id, guild::GuildId, member::MemberId, user::UserId};
use sqlx::PgPool;
use uuid::Uuid;

use crate::guild::domain::{errors::CoreError, member::ports::{MemberRepository, MemberWithUser}};

#[derive(Clone)]
pub struct PostgresMemberRepository {
    pool: PgPool,
}

impl PostgresMemberRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct MemberWithUserRow {
    member_id: Uuid,
    user_id: Uuid,
    username: String,
    display_name: Option<String>,
    avatar_url: Option<String>,
    joined_at: DateTime<Utc>,
}

impl MemberRepository for PostgresMemberRepository {
    async fn insert(&self, guild_id: &GuildId, user_id: &UserId) -> Result<(), CoreError> {
        let member_id = MemberId(Id::new());

        sqlx::query!(
            r#"
            INSERT INTO members (id, guild_id, user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id, user_id) DO NOTHING
            "#,
            member_id.get_uuid(),
            guild_id.get_uuid(),
            user_id.get_uuid(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to insert member: {}", e),
        })?;

        Ok(())
    }

    async fn list_members(&self, guild_id: &GuildId) -> Result<Vec<MemberWithUser>, CoreError> {
        let rows = sqlx::query_as!(
            MemberWithUserRow,
            r#"
            SELECT
                m.id      AS member_id,
                u.id      AS user_id,
                u.username,
                u.display_name,
                u.avatar_url,
                m.joined_at
            FROM members m
            JOIN users u ON u.id = m.user_id
            WHERE m.guild_id = $1
            ORDER BY u.username ASC
            "#,
            guild_id.get_uuid(),
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to list members: {}", e),
        })?;

        Ok(rows.into_iter().map(|r| MemberWithUser {
            member_id: r.member_id,
            user_id: r.user_id,
            username: r.username,
            display_name: r.display_name,
            avatar_url: r.avatar_url,
            joined_at: r.joined_at,
        }).collect())
    }

    async fn delete_member(&self, guild_id: &GuildId, user_id: &UserId) -> Result<(), CoreError> {
        sqlx::query!(
            r#"
            DELETE FROM members
            WHERE guild_id = $1 AND user_id = $2
            "#,
            guild_id.get_uuid(),
            user_id.get_uuid(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to delete member: {}", e),
        })?;

        Ok(())
    }
}
