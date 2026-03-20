use chrono::{DateTime, Utc};
use ferriscord_entities::{
    Id,
    attachment::{Attachment, AttachmentId},
    channel::ChannelId,
    message::{Message, MessageAuthor, MessageId},
    user::UserId,
};

use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::guild::domain::{
    errors::CoreError,
    message::ports::{AttachmentInput, MessagePort},
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

// ─── Row types ────────────────────────────────────────────────────────────────

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

/// Internal row that includes `message_id` for grouping; not exposed in entity.
#[derive(sqlx::FromRow)]
struct AttachmentRow {
    id: Uuid,
    message_id: Uuid,
    filename: String,
    content_type: String,
    size_bytes: i64,
    storage_key: String,
    created_at: DateTime<Utc>,
}

impl AttachmentRow {
    fn into_attachment(self) -> (Uuid, Attachment) {
        let msg_id = self.message_id;
        let att = Attachment {
            id: AttachmentId(Id(self.id)),
            filename: self.filename,
            content_type: self.content_type,
            size_bytes: self.size_bytes,
            storage_key: self.storage_key,
            url: String::new(), // populated by the handler
            created_at: self.created_at,
        };
        (msg_id, att)
    }
}

// ─── SQL helpers ──────────────────────────────────────────────────────────────

const SELECT_MESSAGES_SQL: &str = r#"
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

fn row_to_message(row: MessageRow, attachments: Vec<Attachment>) -> Message {
    Message {
        id: MessageId(Id(row.id)),
        channel_id: ChannelId(Id(row.channel_id)),
        author: MessageAuthor {
            id: UserId::from(row.author_id),
            username: row.author_username,
            avatar_url: row.author_avatar_url,
        },
        content: row.content,
        attachments,
        edited_at: row.edited_at,
        created_at: row.created_at,
    }
}

async fn fetch_attachments_for_messages(
    pool: &PgPool,
    message_ids: &[Uuid],
) -> Result<Vec<AttachmentRow>, sqlx::Error> {
    if message_ids.is_empty() {
        return Ok(vec![]);
    }
    sqlx::query_as::<_, AttachmentRow>(
        r#"
        SELECT id, message_id, filename, content_type, size_bytes, storage_key, created_at
        FROM attachments
        WHERE message_id = ANY($1)
        ORDER BY created_at ASC
        "#,
    )
    .bind(message_ids)
    .fetch_all(pool)
    .await
}

// ─── MessagePort impl ─────────────────────────────────────────────────────────

impl MessagePort for PostgresMessageRepository {
    async fn insert(
        &self,
        channel_id: &ChannelId,
        author_sub: &str,
        content: String,
        attachments: Vec<AttachmentInput>,
    ) -> Result<Message, CoreError> {
        let id = Id::new().get_uuid();
        let now = chrono::Utc::now();

        let mut tx = self.pool.begin().await.map_err(|e| {
            error!("failed to begin transaction: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

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
        .execute(&mut *tx)
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

        // Insert attachments
        for att in &attachments {
            sqlx::query(
                r#"
                INSERT INTO attachments
                    (id, message_id, filename, content_type, size_bytes, storage_key, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                "#,
            )
            .bind(att.id.get_uuid())
            .bind(id)
            .bind(&att.filename)
            .bind(&att.content_type)
            .bind(att.size_bytes)
            .bind(&att.storage_key)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                error!("failed to insert attachment: {}", e);
                CoreError::Unknown { message: e.to_string() }
            })?;
        }

        tx.commit().await.map_err(|e| {
            error!("failed to commit transaction: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        // Fetch the inserted message back
        let sql = format!("{} WHERE m.id = $1", SELECT_MESSAGES_SQL);
        let row = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to fetch inserted message: {}", e);
                CoreError::Unknown { message: e.to_string() }
            })?;

        let attachment_rows =
            fetch_attachments_for_messages(&self.pool, &[id]).await.map_err(|e| {
                error!("failed to fetch attachments: {}", e);
                CoreError::Unknown { message: e.to_string() }
            })?;

        let att_list: Vec<Attachment> = attachment_rows
            .into_iter()
            .map(|r| r.into_attachment().1)
            .collect();

        Ok(row_to_message(row, att_list))
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
                    SELECT_MESSAGES_SQL
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
                    SELECT_MESSAGES_SQL
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
        let mut rows: Vec<MessageRow> = rows;
        rows.reverse();

        let message_ids: Vec<Uuid> = rows.iter().map(|r| r.id).collect();
        let attachment_rows =
            fetch_attachments_for_messages(&self.pool, &message_ids).await.map_err(|e| {
                error!("failed to fetch attachments: {}", e);
                CoreError::Unknown { message: e.to_string() }
            })?;

        // Group attachments by message_id
        let mut att_map: std::collections::HashMap<Uuid, Vec<Attachment>> =
            std::collections::HashMap::new();
        for att_row in attachment_rows {
            let (msg_id, att) = att_row.into_attachment();
            att_map.entry(msg_id).or_default().push(att);
        }

        let messages = rows
            .into_iter()
            .map(|row| {
                let atts = att_map.remove(&row.id).unwrap_or_default();
                row_to_message(row, atts)
            })
            .collect();

        Ok(messages)
    }

    async fn delete(&self, message_id: Uuid, caller_sub: &str) -> Result<bool, CoreError> {
        let result = sqlx::query(
            "DELETE FROM messages WHERE id = $1 AND author_id = (SELECT id FROM users WHERE oauth_sub = $2)",
        )
        .bind(message_id)
        .bind(caller_sub)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to delete message: {}", e);
            CoreError::Unknown { message: e.to_string() }
        })?;

        Ok(result.rows_affected() > 0)
    }
}
