use chrono::Utc;
use sqlx::{PgPool, query_as};

use crate::user::domain::{
    common::CoreError,
    user::{User, UserId, ports::UserRepository},
};

#[derive(Clone)]
pub struct PostgresUserRepository {
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
            .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        Ok(user)
    }

    async fn find_by_sub(&self, sub: &str) -> Result<Option<User>, CoreError> {
        let user = query_as!(User, "SELECT * FROM users WHERE oauth_sub=$1", sub)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        Ok(user)
    }

    async fn insert(&self, user: &User) -> Result<(), CoreError> {
        sqlx::query!(
            r#"INSERT INTO users
            (id, oauth_sub, username, display_name, avatar_url, bio, banner_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"#,
            user.id.0,
            user.oauth_sub,
            user.username,
            user.display_name,
            user.avatar_url,
            user.bio,
            user.banner_url,
            user.created_at,
            user.updated_at
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        Ok(())
    }

    async fn update_profile(
        &self,
        sub: &str,
        display_name: Option<String>,
        avatar_url: Option<String>,
        bio: Option<String>,
        banner_url: Option<String>,
    ) -> Result<User, CoreError> {
        let now = Utc::now();

        // display_name and bio are always updated (None = clear).
        // avatar_url and banner_url use COALESCE so None keeps the current value.
        let user = query_as!(
            User,
            r#"
            UPDATE users
            SET
                display_name = $1,
                avatar_url   = COALESCE($2, avatar_url),
                bio          = $3,
                banner_url   = COALESCE($4, banner_url),
                updated_at   = $5
            WHERE oauth_sub = $6
            RETURNING *
            "#,
            display_name,
            avatar_url,
            bio,
            banner_url,
            now,
            sub,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        Ok(user)
    }
}
