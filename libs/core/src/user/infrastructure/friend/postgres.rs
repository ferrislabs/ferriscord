use chrono::{DateTime, Utc};
use ferriscord_entities::{
    friendship::{FriendUser, Friendship, FriendshipStatus},
    user::UserId,
};
use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::user::domain::{common::CoreError, friend::ports::FriendRepository};

#[derive(Clone)]
pub struct PostgresFriendRepository {
    pool: PgPool,
}

impl PostgresFriendRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct FriendshipRow {
    id: Uuid,
    other_user_id: Uuid,
    other_username: String,
    other_display_name: Option<String>,
    other_avatar_url: Option<String>,
    status: String,
    created_at: DateTime<Utc>,
}

fn row_to_friendship(row: FriendshipRow) -> Result<Friendship, CoreError> {
    let status = FriendshipStatus::try_from(row.status.as_str()).map_err(|_| {
        CoreError::InternalServerError {
            message: format!("invalid friendship status: {}", row.status),
        }
    })?;

    Ok(Friendship {
        id: row.id,
        user: FriendUser {
            id: UserId::from(row.other_user_id),
            username: row.other_username,
            display_name: row.other_display_name,
            avatar_url: row.other_avatar_url,
        },
        status,
        created_at: row.created_at,
    })
}

impl FriendRepository for PostgresFriendRepository {
    async fn send_request(
        &self,
        requester_sub: &str,
        addressee_username: &str,
    ) -> Result<Friendship, CoreError> {
        // Resolve requester
        let requester: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM users WHERE oauth_sub = $1")
                .bind(requester_sub)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;
        let (requester_id,) = requester.ok_or(CoreError::NotFound)?;

        // Resolve addressee
        let addressee: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM users WHERE username = $1")
                .bind(addressee_username)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;
        let (addressee_id,) = addressee.ok_or(CoreError::NotFound)?;

        if requester_id == addressee_id {
            return Err(CoreError::SelfFriendRequest);
        }

        let id = Uuid::now_v7();
        let now = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO friendships (id, requester_id, addressee_id, status, created_at)
            VALUES ($1, $2, $3, 'pending', $4)
            "#,
        )
        .bind(id)
        .bind(requester_id)
        .bind(addressee_id)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
                CoreError::AlreadyFriends
            } else {
                error!("failed to insert friendship: {}", e);
                CoreError::InternalServerError { message: e.to_string() }
            }
        })?;

        // Return the created friendship with the addressee as "other user"
        let row = sqlx::query_as::<_, FriendshipRow>(
            r#"
            SELECT
                f.id,
                u.id    AS other_user_id,
                u.username AS other_username,
                u.display_name AS other_display_name,
                u.avatar_url   AS other_avatar_url,
                f.status,
                f.created_at
            FROM friendships f
            JOIN users u ON u.id = f.addressee_id
            WHERE f.id = $1
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        row_to_friendship(row)
    }

    async fn accept(&self, caller_sub: &str, request_id: Uuid) -> Result<Friendship, CoreError> {
        let result = sqlx::query(
            r#"
            UPDATE friendships
            SET status = 'accepted'
            WHERE id = $1
              AND addressee_id = (SELECT id FROM users WHERE oauth_sub = $2)
              AND status = 'pending'
            "#,
        )
        .bind(request_id)
        .bind(caller_sub)
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        if result.rows_affected() == 0 {
            return Err(CoreError::FriendRequestNotFound);
        }

        // Return with requester as "other user"
        let row = sqlx::query_as::<_, FriendshipRow>(
            r#"
            SELECT
                f.id,
                u.id           AS other_user_id,
                u.username     AS other_username,
                u.display_name AS other_display_name,
                u.avatar_url   AS other_avatar_url,
                f.status,
                f.created_at
            FROM friendships f
            JOIN users u ON u.id = f.requester_id
            WHERE f.id = $1
            "#,
        )
        .bind(request_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        row_to_friendship(row)
    }

    async fn decline(&self, caller_sub: &str, request_id: Uuid) -> Result<(), CoreError> {
        let result = sqlx::query(
            r#"
            UPDATE friendships
            SET status = 'declined'
            WHERE id = $1
              AND addressee_id = (SELECT id FROM users WHERE oauth_sub = $2)
              AND status = 'pending'
            "#,
        )
        .bind(request_id)
        .bind(caller_sub)
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        if result.rows_affected() == 0 {
            return Err(CoreError::FriendRequestNotFound);
        }
        Ok(())
    }

    async fn remove(&self, caller_sub: &str, friend_user_id: Uuid) -> Result<(), CoreError> {
        let result = sqlx::query(
            r#"
            DELETE FROM friendships
            WHERE status = 'accepted'
              AND (
                (requester_id = (SELECT id FROM users WHERE oauth_sub = $1) AND addressee_id = $2)
                OR
                (addressee_id = (SELECT id FROM users WHERE oauth_sub = $1) AND requester_id = $2)
              )
            "#,
        )
        .bind(caller_sub)
        .bind(friend_user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        if result.rows_affected() == 0 {
            return Err(CoreError::NotFriends);
        }
        Ok(())
    }

    async fn list_friends(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        let rows = sqlx::query_as::<_, FriendshipRow>(
            r#"
            SELECT
                f.id,
                CASE WHEN f.requester_id = me.id THEN u2.id ELSE u1.id END AS other_user_id,
                CASE WHEN f.requester_id = me.id THEN u2.username ELSE u1.username END AS other_username,
                CASE WHEN f.requester_id = me.id THEN u2.display_name ELSE u1.display_name END AS other_display_name,
                CASE WHEN f.requester_id = me.id THEN u2.avatar_url ELSE u1.avatar_url END AS other_avatar_url,
                f.status,
                f.created_at
            FROM friendships f
            JOIN users me ON me.oauth_sub = $1
            JOIN users u1 ON u1.id = f.requester_id
            JOIN users u2 ON u2.id = f.addressee_id
            WHERE f.status = 'accepted'
              AND (f.requester_id = me.id OR f.addressee_id = me.id)
            ORDER BY f.created_at DESC
            "#,
        )
        .bind(caller_sub)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list friends: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        rows.into_iter().map(row_to_friendship).collect()
    }

    async fn list_incoming(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        let rows = sqlx::query_as::<_, FriendshipRow>(
            r#"
            SELECT
                f.id,
                u.id           AS other_user_id,
                u.username     AS other_username,
                u.display_name AS other_display_name,
                u.avatar_url   AS other_avatar_url,
                f.status,
                f.created_at
            FROM friendships f
            JOIN users u ON u.id = f.requester_id
            WHERE f.addressee_id = (SELECT id FROM users WHERE oauth_sub = $1)
              AND f.status = 'pending'
            ORDER BY f.created_at DESC
            "#,
        )
        .bind(caller_sub)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list incoming requests: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        rows.into_iter().map(row_to_friendship).collect()
    }

    async fn list_outgoing(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        let rows = sqlx::query_as::<_, FriendshipRow>(
            r#"
            SELECT
                f.id,
                u.id           AS other_user_id,
                u.username     AS other_username,
                u.display_name AS other_display_name,
                u.avatar_url   AS other_avatar_url,
                f.status,
                f.created_at
            FROM friendships f
            JOIN users u ON u.id = f.addressee_id
            WHERE f.requester_id = (SELECT id FROM users WHERE oauth_sub = $1)
              AND f.status = 'pending'
            ORDER BY f.created_at DESC
            "#,
        )
        .bind(caller_sub)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list outgoing requests: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        rows.into_iter().map(row_to_friendship).collect()
    }
}
