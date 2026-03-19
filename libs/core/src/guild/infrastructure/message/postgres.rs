use chrono::{DateTime, Utc};
use ferriscord_entities::{
    Id,
    channel::ChannelId,
    message::{Message, MessageAuthor, MessageId},
    user::UserId,
};

use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::guild::domain::{
    message::ports::MessagePort,
    errors::CoreError,
};

#[derive(Clone)]
pub struct PostgresMessageRepository {
    pool: PgPool,
}

impl PostgresMessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct MessageRow {
    id: Uuid,
    channel_id: Uuid,
    author_id: Uuid,
    author_username: String,
    author_avatar_url: Option<String>,
    content: String,
    edited_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
}

impl From<MessageRow> for Message {
    fn from(row: MessageRow) -> Self {
        Message {
            id: MessageId(Id(row.id)),
            channel_id: ChannelId(Id(row.channel_id)),
            author: MessageAuthor {
                id: UserId::from(row.author_id),
                username: row.author_username,
                avatar_url: row.author_avatar_url,
            },
            content: row.content,
            edited_at: row.edited_at,
            created_at: row.created_at,
        }
    }
}

const SELECT_SQL: &str = r#"
    SELECT
        m.id,
        m.channel_id,
        m.author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        m.content,
        m.edited_at,
        m.created_at
    FROM messages m
    JOIN users u ON u.id = m.author_id
"#;

impl MessagePort for PostgresMessageRepository {
    async fn insert(
        &self,
        channel_id: &ChannelId,
        author_sub: &str,
        content: String,
    ) -> Result<Message, CoreError> {
        let id = Id::new().get_uuid();
        let now = chrono::Utc::now();

        // Resolve oauth_sub → users.id in a single INSERT … SELECT
        let rows_affected = sqlx::query(
            r#"
            INSERT INTO messages (id, channel_id, author_id, content, created_at)
            SELECT $1, $2, id, $3, $4 FROM users WHERE oauth_sub = $5
            "#,
        )
        .bind(id)
        .bind(channel_id.get_uuid())
        .bind(&content)
        .bind(now)
        .bind(author_sub)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to insert message: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        if rows_affected.rows_affected() == 0 {
            return Err(CoreError::Unknown {
                message: format!("user with sub '{}' not found", author_sub),
            });
        }

        let sql = format!("{} WHERE m.id = $1", SELECT_SQL);
        let row = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to fetch inserted message: {}", e);
                CoreError::Unknown { message: e.to_string() }
            })?;

        Ok(Message::from(row))
    }

    async fn list_by_channel(
        &self,
        channel_id: &ChannelId,
        before: Option<MessageId>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        let rows = match before {
            Some(ref before_id) => {
                let sql = format!(
                    "{} WHERE m.channel_id = $1 AND m.created_at < \
                     (SELECT created_at FROM messages WHERE id = $2) \
                     ORDER BY m.created_at DESC LIMIT $3",
                    SELECT_SQL
                );
                sqlx::query_as::<_, MessageRow>(&sql)
                    .bind(channel_id.get_uuid())
                    .bind(before_id.get_uuid())
                    .bind(limit as i64)
                    .fetch_all(&self.pool)
                    .await
            }
            None => {
                let sql = format!(
                    "{} WHERE m.channel_id = $1 ORDER BY m.created_at DESC LIMIT $2",
                    SELECT_SQL
                );
                sqlx::query_as::<_, MessageRow>(&sql)
                    .bind(channel_id.get_uuid())
                    .bind(limit as i64)
                    .fetch_all(&self.pool)
                    .await
            }
        }
        .map_err(|e| {
            error!("failed to list messages for channel {}: {}", channel_id, e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        // Reverse to return oldest-first within the page
        let mut messages: Vec<Message> = rows.into_iter().map(Message::from).collect();
        messages.reverse();
        Ok(messages)
    }
}
