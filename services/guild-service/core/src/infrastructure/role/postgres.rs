use chrono::Utc;
use ferriscord_entities::{
    Id,
    guild::GuildId,
    role::{Role, RoleId},
};
use ferriscord_pagination::PaginationParams;
use ferriscord_permission::Permissions;
use sqlx::PgPool;

use crate::domain::{errors::CoreError, role::ports::RoleRepository};

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

    async fn find_by_guild_id(
        &self,
        guild_id: GuildId,
        params: PaginationParams,
    ) -> Result<(Vec<Role>, u64), CoreError> {
        let count_row = sqlx::query!(
            r#"
            SELECT COUNT(*) as "count!"
            FROM roles
            WHERE guild_id = $1
            "#,
            guild_id.get_uuid()
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to count roles by guild id: {:?}", e),
        })?;

        let total = count_row.count as u64;

        let offset = ((params.page.max(1) - 1) * params.per_page) as i64;
        let limit = params.per_page as i64;

        let rows = sqlx::query!(
            r#"
            SELECT id, guild_id, name, position, color, permissions, created_at
            FROM roles
            WHERE guild_id = $1
            ORDER BY position ASC
            LIMIT $2 OFFSET $3
            "#,
            guild_id.get_uuid(),
            limit,
            offset,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to query roles by guild id: {:?}", e),
        })?;

        let roles: Result<Vec<Role>, CoreError> = rows
            .into_iter()
            .map(|row| {
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
            })
            .collect();

        Ok((roles?, total))
    }
}
