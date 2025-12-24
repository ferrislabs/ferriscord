use chrono::Utc;
use ferriscord_permission::Permissions;
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

        let permissions =
            Permissions::from_bits(row.permissions as u64).ok_or(CoreError::Unknown {
                message: "invalid permissions bits".to_string(),
            })?;

        Ok(Role {
            id: RoleId(Id(row.id)),
            guild_id: GuildId(Id(row.guild_id)),
            name: row.name,
            position: row.position,
            color: row.color.unwrap_or(0) as u32,
            hoist: false,
            mentionable: false,
            permissions,
            created_at: row.created_at,
        })
    }

    async fn find_by_id(&self, id: RoleId) -> Result<Role, CoreError> {
        let row = sqlx::query!(
                    "SELECT id, guild_id, name, position, color, permissions, created_at FROM roles WHERE id = $1",
                    id.0.get_uuid()
                )
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| CoreError::Unknown {
                    message: format!("failed to query role by id: {:?}", e),
                })?;

        match row {
            Some(row) => {
                let permissions =
                    Permissions::from_bits(row.permissions as u64).ok_or(CoreError::Unknown {
                        message: "invalid permissions bits".to_string(),
                    })?;

                Ok(Role {
                    id: RoleId(Id(row.id)),
                    guild_id: GuildId(Id(row.guild_id)),
                    name: row.name,
                    position: row.position,
                    color: row.color.unwrap_or(0) as u32,
                    hoist: false,
                    mentionable: false,
                    permissions,
                    created_at: row.created_at,
                })
            }
            None => Err(CoreError::Unknown {
                message: format!("role with id {} not found", id),
            }),
        }
    }

    async fn delete_by_id(&self, id: RoleId) -> Result<(), CoreError> {
        let result = sqlx::query!("DELETE FROM roles WHERE id = $1", id.0.get_uuid())
            .execute(&self.pool)
            .await
            .map_err(|e| CoreError::Unknown {
                message: format!("failed to delete role by id: {:?}", e),
            })?;

        if result.rows_affected() == 0 {
            return Err(CoreError::Unknown {
                message: format!("role with id {} not found", id),
            });
        }

        Ok(())
    }
}
