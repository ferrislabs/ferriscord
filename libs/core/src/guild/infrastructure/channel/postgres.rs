use chrono::{DateTime, Utc};
use ferriscord_entities::{
    Id,
    channel::{
        AutoArchiveDuration, Channel, ChannelFlags, ChannelId, ChannelKind, DefaultReaction,
        ForumLayout, ForumTag, PermissionOverwrite, SortOrder,
    },
    guild::GuildId,
};
use sqlx::PgPool;
use tracing::error;
use uuid::Uuid;

use crate::guild::domain::{
    channel::{
        entities::{CreateChannelInput, UpdateChannelInput},
        ports::ChannelPort,
    },
    errors::CoreError,
};

#[derive(Clone)]
pub struct PostgresChannelRepository {
    pool: PgPool,
}

impl PostgresChannelRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct ChannelRow {
    id: Uuid,
    kind: i16,
    guild_id: Option<Uuid>,
    position: i32,
    name: String,
    topic: Option<String>,
    nsfw: bool,
    last_message_id: Option<Uuid>,
    rate_limit_per_user: i32,
    parent_id: Option<Uuid>,
    last_pin_timestamp: Option<DateTime<Utc>>,
    bitrate: Option<i32>,
    user_limit: Option<i32>,
    rtc_region: Option<String>,
    default_auto_archive_duration: Option<i32>,
    flags: i32,
    // JSONB cast to TEXT so no json sqlx feature needed
    permission_overwrites: String,
    available_tags: String,
    default_reaction_emoji: Option<String>,
    default_thread_rate_limit_per_user: i32,
    default_sort_order: Option<i16>,
    default_forum_layout: Option<i16>,
    created_at: DateTime<Utc>,
}

impl TryFrom<ChannelRow> for Channel {
    type Error = CoreError;

    fn try_from(row: ChannelRow) -> Result<Self, Self::Error> {
        let kind = ChannelKind::try_from(row.kind).map_err(|_| CoreError::Unknown {
            message: format!("invalid channel kind: {}", row.kind),
        })?;

        let permission_overwrites: Vec<PermissionOverwrite> =
            serde_json::from_str(&row.permission_overwrites).unwrap_or_default();

        let available_tags: Vec<ForumTag> =
            serde_json::from_str(&row.available_tags).unwrap_or_default();

        let default_reaction_emoji: Option<DefaultReaction> = row
            .default_reaction_emoji
            .as_deref()
            .and_then(|s| serde_json::from_str(s).ok());

        let default_auto_archive_duration = row
            .default_auto_archive_duration
            .and_then(|v| AutoArchiveDuration::try_from(v as u32).ok());

        let default_sort_order = row
            .default_sort_order
            .and_then(|v| SortOrder::try_from(v).ok());

        let default_forum_layout = row
            .default_forum_layout
            .and_then(|v| ForumLayout::try_from(v).ok());

        Ok(Channel {
            id: ChannelId(Id(row.id)),
            kind,
            guild_id: row.guild_id.map(|id| GuildId(Id(id))),
            position: row.position,
            permission_overwrites,
            name: row.name,
            topic: row.topic,
            nsfw: row.nsfw,
            last_message_id: row.last_message_id,
            rate_limit_per_user: row.rate_limit_per_user as u32,
            parent_id: row.parent_id.map(|id| ChannelId(Id(id))),
            last_pin_timestamp: row.last_pin_timestamp,
            bitrate: row.bitrate.map(|v| v as u32),
            user_limit: row.user_limit.map(|v| v as u32),
            rtc_region: row.rtc_region,
            default_auto_archive_duration,
            flags: ChannelFlags(row.flags as u32),
            available_tags,
            default_reaction_emoji,
            default_thread_rate_limit_per_user: row.default_thread_rate_limit_per_user as u32,
            default_sort_order,
            default_forum_layout,
            created_at: row.created_at,
        })
    }
}

/// SQL select fragment — JSONB columns cast to TEXT to avoid needing the sqlx json feature.
const SELECT_SQL: &str = r#"
    SELECT
        id, kind, guild_id, position, name, topic, nsfw,
        last_message_id, rate_limit_per_user, parent_id, last_pin_timestamp,
        bitrate, user_limit, rtc_region, default_auto_archive_duration, flags,
        permission_overwrites::TEXT  AS permission_overwrites,
        available_tags::TEXT         AS available_tags,
        default_reaction_emoji::TEXT AS default_reaction_emoji,
        default_thread_rate_limit_per_user, default_sort_order, default_forum_layout,
        created_at
    FROM channels
"#;

impl ChannelPort for PostgresChannelRepository {
    async fn insert(&self, input: CreateChannelInput, position: i32) -> Result<Channel, CoreError> {
        let id = Id::new().get_uuid();
        let now = chrono::Utc::now();

        let permission_overwrites_json =
            serde_json::to_string(&input.permission_overwrites.unwrap_or_default())
                .unwrap_or_else(|_| "[]".to_string());

        let available_tags_json = serde_json::to_string(&input.available_tags.unwrap_or_default())
            .unwrap_or_else(|_| "[]".to_string());

        let default_reaction_emoji_json = input
            .default_reaction_emoji
            .as_ref()
            .and_then(|r| serde_json::to_string(r).ok());

        let kind: i16 = input.kind.into();
        let flags = input.flags.unwrap_or_default().0 as i32;
        let nsfw = input.nsfw.unwrap_or(false);
        let rate_limit = input.rate_limit_per_user.unwrap_or(0) as i32;
        let thread_rate_limit = input.default_thread_rate_limit_per_user.unwrap_or(0) as i32;
        let bitrate = input.bitrate.map(|v| v as i32);
        let user_limit = input.user_limit.map(|v| v as i32);
        let parent_id = input.parent_id.as_ref().map(|id| id.get_uuid());
        let auto_archive = input
            .default_auto_archive_duration
            .map(|d| u32::from(d) as i32);
        let sort_order = input.default_sort_order.map(i16::from);
        let forum_layout = input.default_forum_layout.map(i16::from);

        sqlx::query(
            r#"
            INSERT INTO channels (
                id, kind, guild_id, position, name, topic, nsfw,
                rate_limit_per_user, parent_id, bitrate, user_limit, rtc_region,
                default_auto_archive_duration, flags,
                permission_overwrites, available_tags, default_reaction_emoji,
                default_thread_rate_limit_per_user, default_sort_order, default_forum_layout,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14,
                $15::JSONB, $16::JSONB, $17::JSONB,
                $18, $19, $20,
                $21
            )
            "#,
        )
        .bind(id)
        .bind(kind)
        .bind(input.guild_id.get_uuid())
        .bind(position)
        .bind(&input.name)
        .bind(&input.topic)
        .bind(nsfw)
        .bind(rate_limit)
        .bind(parent_id)
        .bind(bitrate)
        .bind(user_limit)
        .bind(&input.rtc_region)
        .bind(auto_archive)
        .bind(flags)
        .bind(&permission_overwrites_json)
        .bind(&available_tags_json)
        .bind(&default_reaction_emoji_json)
        .bind(thread_rate_limit)
        .bind(sort_order)
        .bind(forum_layout)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to insert channel: {}", e);
            CoreError::Unknown {
                message: e.to_string(),
            }
        })?;

        self.find_by_id(&ChannelId(Id(id)))
            .await?
            .ok_or_else(|| CoreError::Unknown {
                message: "channel inserted but could not be fetched".to_string(),
            })
    }

    async fn find_by_id(&self, channel_id: &ChannelId) -> Result<Option<Channel>, CoreError> {
        let sql = format!("{} WHERE id = $1", SELECT_SQL);

        let row = sqlx::query_as::<_, ChannelRow>(&sql)
            .bind(channel_id.get_uuid())
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to find channel {}: {}", channel_id, e);
                CoreError::Unknown {
                    message: e.to_string(),
                }
            })?;

        row.map(Channel::try_from).transpose()
    }

    async fn list_by_guild(&self, guild_id: &GuildId) -> Result<Vec<Channel>, CoreError> {
        let sql = format!(
            "{} WHERE guild_id = $1 ORDER BY position ASC, id ASC",
            SELECT_SQL
        );

        let rows = sqlx::query_as::<_, ChannelRow>(&sql)
            .bind(guild_id.get_uuid())
            .fetch_all(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to list channels for guild {}: {}", guild_id, e);
                CoreError::Unknown {
                    message: e.to_string(),
                }
            })?;

        rows.into_iter().map(Channel::try_from).collect()
    }

    async fn update_channel(
        &self,
        channel_id: &ChannelId,
        input: UpdateChannelInput,
    ) -> Result<Channel, CoreError> {
        let parent_id = input.parent_id.as_ref().map(|id| id.get_uuid());
        let permission_overwrites_json = input.permission_overwrites.as_ref().map(|overwrites| {
            serde_json::to_string(overwrites).unwrap_or_else(|_| "[]".to_string())
        });
        let name = input.name;

        sqlx::query(
            "UPDATE channels
             SET parent_id = $1,
                 position = $2,
                 permission_overwrites = COALESCE($3::JSONB, permission_overwrites),
                 name = COALESCE($4, name)
             WHERE id = $5",
        )
        .bind(parent_id)
        .bind(input.position)
        .bind(permission_overwrites_json)
        .bind(name)
        .bind(channel_id.get_uuid())
        .execute(&self.pool)
        .await
        .map_err(|e| {
            error!("failed to update channel {}: {}", channel_id, e);
            CoreError::Unknown {
                message: e.to_string(),
            }
        })?;

        self.find_by_id(channel_id)
            .await?
            .ok_or_else(|| CoreError::Unknown {
                message: "channel updated but could not be fetched".to_string(),
            })
    }

    async fn delete_channel(&self, channel_id: &ChannelId) -> Result<(), CoreError> {
        sqlx::query("DELETE FROM channels WHERE id = $1")
            .bind(channel_id.get_uuid())
            .execute(&self.pool)
            .await
            .map_err(|e| {
                error!("failed to delete channel {}: {}", channel_id, e);
                CoreError::Unknown {
                    message: e.to_string(),
                }
            })?;

        Ok(())
    }
}
