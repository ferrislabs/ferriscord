use chrono::Utc;
use sqlx::PgPool;

use crate::domain::{
    Id,
    errors::CoreError,
    guild::entities::GuildId,
    role::{
        entities::{Role, RoleId},
        ports::RoleRepository,
    },
};

#[derive(Clone)]
pub struct PostgresRoleRepository {
    pool: PgPool,
}

impl PostgresRoleRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl RoleRepository for PostgresRoleRepository {
    async fn insert(
        &self,
        name: &str,
        color: u32,
        permissions: u64,
        guild_id: &GuildId,
    ) -> Result<Role, CoreError> {
        let role_id = RoleId(Id::new());
        let created_at = Utc::now();

        let position = 0i32;

        let row = sqlx::query!(
            r#"
            INSERT INTO roles (id, guild_id, name, position, color, permissions, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, guild_id, name, position, color, permissions, created_at
            "#,
            role_id.0.get_uuid(),
            guild_id.get_uuid(),
            name,
            position,
            color as i32,
            permissions as i64,
            created_at,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to insert role: {:?}", e),
        })?;

        Ok(Role {
            id: RoleId(Id(row.id)),
            guild_id: GuildId(Id(row.guild_id)),
            name: row.name,
            position: row.position,
            color: row.color.unwrap_or(0) as u32,
            permissions: row.permissions as u64,
            created_at: row.created_at,
        })
    }
}
