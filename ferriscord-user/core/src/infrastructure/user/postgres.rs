use sqlx::{PgPool, query_as};

use crate::domain::{
    common::CoreError,
    user::{User, UserId, ports::UserRepository},
};

#[derive(Clone)]
pub struct PostgresUserRepository {
    #[allow(dead_code)]
    pool: PgPool,
}

impl PostgresUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: UserId) -> Result<Option<User>, CoreError> {
        let user = query_as!(User, "SELECT * FROM users WHERE id=$1", id.0)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| CoreError::InternalServerError {
                message: e.to_string(),
            })?;

        Ok(user)
    }

    async fn find_by_sub(&self, sub: &str) -> Result<Option<User>, CoreError> {
        let user = query_as!(User, "SELECT * FROM users WHERE oauth_sub=$1", sub)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| CoreError::InternalServerError {
                message: e.to_string(),
            })?;

        Ok(user)
    }

    async fn insert(&self, user: &User) -> Result<(), CoreError> {
        sqlx::query!(
            r#"INSERT INTO users
            (id, oauth_sub, username, display_name, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
            user.id.0,
            user.oauth_sub,
            user.username,
            user.display_name,
            user.avatar_url,
            user.created_at,
            user.updated_at
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError {
            message: e.to_string(),
        })?;

        Ok(())
    }
}
