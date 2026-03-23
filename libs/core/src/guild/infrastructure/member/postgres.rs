use std::collections::HashMap;

use chrono::{DateTime, Utc};
use ferriscord_entities::{Id, guild::GuildId, member::MemberId, role::RoleId, user::UserId};
use sqlx::PgPool;
use uuid::Uuid;

use crate::guild::domain::{
    errors::CoreError,
    member::ports::{MemberRepository, MemberWithUser, RoleSummary},
};

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

#[derive(sqlx::FromRow)]
struct MemberRoleRow {
    member_id: Uuid,
    role_id: Uuid,
    role_name: String,
    color: i32,
    position: i32,
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

        if rows.is_empty() {
            return Ok(vec![]);
        }

        let member_ids: Vec<Uuid> = rows.iter().map(|r| r.member_id).collect();

        let role_rows = sqlx::query_as!(
            MemberRoleRow,
            r#"
            SELECT
                ra.member_id,
                r.id           AS role_id,
                r.name         AS role_name,
                COALESCE(r.color, 0) AS "color!: i32",
                r.position
            FROM role_assignments ra
            JOIN roles r ON r.id = ra.role_id
            WHERE ra.member_id = ANY($1)
            ORDER BY r.position ASC
            "#,
            &member_ids,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to list member roles: {}", e),
        })?;

        let mut roles_by_member: HashMap<Uuid, Vec<RoleSummary>> = HashMap::new();
        for row in role_rows {
            roles_by_member.entry(row.member_id).or_default().push(RoleSummary {
                id: row.role_id,
                name: row.role_name,
                color: row.color as u32,
                position: row.position,
            });
        }

        Ok(rows
            .into_iter()
            .map(|r| MemberWithUser {
                member_id: r.member_id,
                user_id: r.user_id,
                username: r.username,
                display_name: r.display_name,
                avatar_url: r.avatar_url,
                joined_at: r.joined_at,
                roles: roles_by_member.remove(&r.member_id).unwrap_or_default(),
            })
            .collect())
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

    async fn assign_role(
        &self,
        guild_id: &GuildId,
        user_id: &UserId,
        role_id: &RoleId,
    ) -> Result<(), CoreError> {
        sqlx::query!(
            r#"
            INSERT INTO role_assignments (role_id, member_id)
            SELECT $1, m.id
            FROM members m
            WHERE m.guild_id = $2 AND m.user_id = $3
            ON CONFLICT DO NOTHING
            "#,
            role_id.0.get_uuid(),
            guild_id.get_uuid(),
            user_id.get_uuid(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to assign role: {}", e),
        })?;

        Ok(())
    }

    async fn remove_role(
        &self,
        guild_id: &GuildId,
        user_id: &UserId,
        role_id: &RoleId,
    ) -> Result<(), CoreError> {
        sqlx::query!(
            r#"
            DELETE FROM role_assignments ra
            USING members m
            WHERE ra.role_id = $1
              AND ra.member_id = m.id
              AND m.guild_id = $2
              AND m.user_id = $3
            "#,
            role_id.0.get_uuid(),
            guild_id.get_uuid(),
            user_id.get_uuid(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to remove role: {}", e),
        })?;

        Ok(())
    }
}
