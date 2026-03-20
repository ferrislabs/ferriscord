use chrono::{DateTime, Utc};
use ferriscord_entities::{
    Id,
    attachment::{Attachment, AttachmentId},
    channel::ChannelId,
    friendship::{DmChannel, FriendUser},
    message::{Message, MessageAuthor, MessageId},
    user::UserId,
};
use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::user::domain::{
    common::CoreError,
    dm::ports::{DmAttachmentInput, DmRepository},
};

#[derive(Clone)]
pub struct PostgresDmRepository {
    pool: PgPool,
}

impl PostgresDmRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// ─── Row types ────────────────────────────────────────────────────────────────

#[derive(sqlx::FromRow)]
struct DmChannelRow {
    id: Uuid,
    recipient_id: Uuid,
    recipient_username: String,
    recipient_display_name: Option<String>,
    recipient_avatar_url: Option<String>,
    created_at: DateTime<Utc>,
}

impl DmChannelRow {
    fn into_dm_channel(self) -> DmChannel {
        DmChannel {
            id: ChannelId(Id(self.id)),
            recipient: FriendUser {
                id: UserId::from(self.recipient_id),
                username: self.recipient_username,
                display_name: self.recipient_display_name,
                avatar_url: self.recipient_avatar_url,
            },
            created_at: self.created_at,
        }
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

async fn fetch_attachments(
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

// ─── DmRepository impl ────────────────────────────────────────────────────────

impl DmRepository for PostgresDmRepository {
    async fn create_or_get(
        &self,
        caller_sub: &str,
        recipient_id: Uuid,
    ) -> Result<DmChannel, CoreError> {
        // Resolve caller
        let caller: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM users WHERE oauth_sub = $1")
                .bind(caller_sub)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;
        let (caller_id,) = caller.ok_or(CoreError::NotFound)?;

        // Check recipient exists
        let recipient_check: Option<(Uuid,)> =
            sqlx::query_as("SELECT id FROM users WHERE id = $1")
                .bind(recipient_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;
        if recipient_check.is_none() {
            return Err(CoreError::NotFound);
        }

        // Find existing DM channel between the two users
        let existing: Option<(Uuid,)> = sqlx::query_as(
            r#"
            SELECT dp1.channel_id
            FROM dm_participants dp1
            JOIN dm_participants dp2 ON dp1.channel_id = dp2.channel_id
            WHERE dp1.user_id = $1 AND dp2.user_id = $2
            LIMIT 1
            "#,
        )
        .bind(caller_id)
        .bind(recipient_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        let channel_id = if let Some((id,)) = existing {
            id
        } else {
            // Create a new DM channel in a transaction
            let id = Uuid::now_v7();
            let now = Utc::now();

            let mut tx = self.pool.begin().await.map_err(|e| {
                CoreError::InternalServerError { message: e.to_string() }
            })?;

            sqlx::query(
                r#"
                INSERT INTO channels (
                    id, kind, guild_id, position, name, nsfw,
                    rate_limit_per_user, default_thread_rate_limit_per_user,
                    flags, permission_overwrites, available_tags, created_at
                ) VALUES (
                    $1, 1, NULL, 0, '', false,
                    0, 0,
                    0, '[]'::jsonb, '[]'::jsonb, $2
                )
                "#,
            )
            .bind(id)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                error!("failed to create DM channel: {}", e);
                CoreError::InternalServerError { message: e.to_string() }
            })?;

            sqlx::query(
                "INSERT INTO dm_participants (channel_id, user_id) VALUES ($1, $2), ($1, $3)",
            )
            .bind(id)
            .bind(caller_id)
            .bind(recipient_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                error!("failed to insert dm_participants: {}", e);
                CoreError::InternalServerError { message: e.to_string() }
            })?;

            tx.commit().await.map_err(|e| {
                CoreError::InternalServerError { message: e.to_string() }
            })?;

            id
        };

        // Fetch the DM channel with recipient info
        let row = sqlx::query_as::<_, DmChannelRow>(
            r#"
            SELECT
                c.id,
                u.id           AS recipient_id,
                u.username     AS recipient_username,
                u.display_name AS recipient_display_name,
                u.avatar_url   AS recipient_avatar_url,
                c.created_at
            FROM channels c
            JOIN dm_participants dp ON dp.channel_id = c.id AND dp.user_id <> $1
            JOIN users u ON u.id = dp.user_id
            WHERE c.id = $2
            "#,
        )
        .bind(caller_id)
        .bind(channel_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        Ok(row.into_dm_channel())
    }

    async fn list(&self, caller_sub: &str) -> Result<Vec<DmChannel>, CoreError> {
        let rows = sqlx::query_as::<_, DmChannelRow>(
            r#"
            SELECT
                c.id,
                u.id           AS recipient_id,
                u.username     AS recipient_username,
                u.display_name AS recipient_display_name,
                u.avatar_url   AS recipient_avatar_url,
                c.created_at
            FROM channels c
            JOIN dm_participants dp_me   ON dp_me.channel_id  = c.id
            JOIN users me               ON me.id = dp_me.user_id AND me.oauth_sub = $1
            JOIN dm_participants dp_other ON dp_other.channel_id = c.id AND dp_other.user_id <> me.id
            JOIN users u ON u.id = dp_other.user_id
            WHERE c.kind = 1
            ORDER BY c.created_at DESC
            "#,
        )
        .bind(caller_sub)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to list DMs: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        Ok(rows.into_iter().map(|r| r.into_dm_channel()).collect())
    }

    async fn get_messages(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        before: Option<Uuid>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        // Verify caller is a participant
        let is_participant: Option<(bool,)> = sqlx::query_as(
            r#"
            SELECT true
            FROM dm_participants dp
            JOIN users u ON u.id = dp.user_id AND u.oauth_sub = $1
            WHERE dp.channel_id = $2
            "#,
        )
        .bind(caller_sub)
        .bind(channel_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        if is_participant.is_none() {
            return Err(CoreError::DmChannelNotFound);
        }

        let rows = match before {
            Some(before_id) => {
                let sql = format!(
                    "{} WHERE m.channel_id = $1 AND m.created_at < \
                     (SELECT created_at FROM messages WHERE id = $2) \
                     ORDER BY m.created_at DESC LIMIT $3",
                    SELECT_MESSAGES_SQL
                );
                sqlx::query_as::<_, MessageRow>(&sql)
                    .bind(channel_id)
                    .bind(before_id)
                    .bind(limit.min(100) as i64)
                    .fetch_all(&self.pool)
                    .await
            }
            None => {
                let sql = format!(
                    "{} WHERE m.channel_id = $1 ORDER BY m.created_at DESC LIMIT $2",
                    SELECT_MESSAGES_SQL
                );
                sqlx::query_as::<_, MessageRow>(&sql)
                    .bind(channel_id)
                    .bind(limit.min(100) as i64)
                    .fetch_all(&self.pool)
                    .await
            }
        }
        .map_err(|e| {
            error!("failed to get DM messages: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        let mut rows: Vec<MessageRow> = rows;
        rows.reverse();

        let message_ids: Vec<Uuid> = rows.iter().map(|r| r.id).collect();
        let att_rows = fetch_attachments(&self.pool, &message_ids)
            .await
            .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        let mut att_map: std::collections::HashMap<Uuid, Vec<Attachment>> =
            std::collections::HashMap::new();
        for ar in att_rows {
            let att = Attachment {
                id: AttachmentId(Id(ar.id)),
                filename: ar.filename,
                content_type: ar.content_type,
                size_bytes: ar.size_bytes,
                storage_key: ar.storage_key,
                url: String::new(),
                created_at: ar.created_at,
            };
            att_map.entry(ar.message_id).or_default().push(att);
        }

        Ok(rows
            .into_iter()
            .map(|r| {
                let atts = att_map.remove(&r.id).unwrap_or_default();
                row_to_message(r, atts)
            })
            .collect())
    }

    async fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
    ) -> Result<Message, CoreError> {
        // Verify participant
        let is_participant: Option<(bool,)> = sqlx::query_as(
            r#"
            SELECT true
            FROM dm_participants dp
            JOIN users u ON u.id = dp.user_id AND u.oauth_sub = $1
            WHERE dp.channel_id = $2
            "#,
        )
        .bind(caller_sub)
        .bind(channel_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        if is_participant.is_none() {
            return Err(CoreError::DmChannelNotFound);
        }

        let id = Uuid::now_v7();
        let now = Utc::now();

        let mut tx = self.pool.begin().await.map_err(|e| {
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        let rows_affected = sqlx::query(
            r#"
            INSERT INTO messages (id, channel_id, author_id, content, created_at)
            SELECT $1, $2, id, $3, $4 FROM users WHERE oauth_sub = $5
            "#,
        )
        .bind(id)
        .bind(channel_id)
        .bind(&content)
        .bind(now)
        .bind(caller_sub)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            error!("failed to insert DM message: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        if rows_affected.rows_affected() == 0 {
            return Err(CoreError::NotFound);
        }

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
                error!("failed to insert DM attachment: {}", e);
                CoreError::InternalServerError { message: e.to_string() }
            })?;
        }

        tx.commit().await.map_err(|e| {
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        let sql = format!("{} WHERE m.id = $1", SELECT_MESSAGES_SQL);
        let row = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        let att_rows = fetch_attachments(&self.pool, &[id])
            .await
            .map_err(|e| CoreError::InternalServerError { message: e.to_string() })?;

        let att_list: Vec<Attachment> = att_rows
            .into_iter()
            .map(|ar| Attachment {
                id: AttachmentId(Id(ar.id)),
                filename: ar.filename,
                content_type: ar.content_type,
                size_bytes: ar.size_bytes,
                storage_key: ar.storage_key,
                url: String::new(),
                created_at: ar.created_at,
            })
            .collect();

        Ok(row_to_message(row, att_list))
    }

    async fn delete_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        message_id: Uuid,
    ) -> Result<bool, CoreError> {
        let result = sqlx::query(
            "DELETE FROM messages WHERE id = $1 AND channel_id = $2 AND author_id = (SELECT id FROM users WHERE oauth_sub = $3)",
        )
        .bind(message_id)
        .bind(channel_id)
        .bind(caller_sub)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to delete dm message: {}", e);
            CoreError::InternalServerError { message: e.to_string() }
        })?;

        Ok(result.rows_affected() > 0)
    }
}
