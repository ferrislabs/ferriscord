use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::channel::{
    AutoArchiveDuration, Channel, ChannelFlags, ChannelId, ChannelKind, DefaultReaction,
    ForumLayout, ForumTag, PermissionOverwrite, SortOrder,
};
use ferriscord_entities::{Id, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::channel::{
    entities::CreateChannelInput, ports::ChannelService,
};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels")]
pub struct CreateChannelRoute {
    guild_id: Uuid,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateChannelRequest {
    pub name: String,
    pub kind: ChannelKind,
    pub topic: Option<String>,
    pub position: Option<i32>,
    pub nsfw: Option<bool>,
    pub rate_limit_per_user: Option<u32>,
    pub parent_id: Option<Uuid>,
    pub bitrate: Option<u32>,
    pub user_limit: Option<u32>,
    pub rtc_region: Option<String>,
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
    pub default_auto_archive_duration: Option<AutoArchiveDuration>,
    pub flags: Option<u32>,
    pub available_tags: Option<Vec<ForumTag>>,
    pub default_reaction_emoji: Option<DefaultReaction>,
    pub default_thread_rate_limit_per_user: Option<u32>,
    pub default_sort_order: Option<SortOrder>,
    pub default_forum_layout: Option<ForumLayout>,
}

#[utoipa::path(
    post,
    path = "/guilds/{guild_id}/channels",
    tag = "channels",
    summary = "Create a guild channel",
    description = "Creates a new channel in the specified guild. Requires MANAGE_CHANNELS permission.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
    ),
    request_body = CreateChannelRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 201, description = "Channel created", body = Channel),
        (status = 400, description = "Invalid request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Missing MANAGE_CHANNELS permission", body = ApiError),
        (status = 404, description = "Guild or parent channel not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn create_channel_handler(
    CreateChannelRoute { guild_id }: CreateChannelRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreateChannelRequest>,
) -> Result<Response<Channel>, ApiError> {
    let guild_id = GuildId(Id(guild_id));

    let input = CreateChannelInput {
        name: req.name,
        kind: req.kind,
        guild_id: guild_id.clone(),
        topic: req.topic,
        position: req.position,
        nsfw: req.nsfw,
        rate_limit_per_user: req.rate_limit_per_user,
        parent_id: req.parent_id.map(|id| ChannelId(Id(id))),
        bitrate: req.bitrate,
        user_limit: req.user_limit,
        rtc_region: req.rtc_region,
        permission_overwrites: req.permission_overwrites,
        default_auto_archive_duration: req.default_auto_archive_duration,
        flags: req.flags.map(ChannelFlags),
        available_tags: req.available_tags,
        default_reaction_emoji: req.default_reaction_emoji,
        default_thread_rate_limit_per_user: req.default_thread_rate_limit_per_user,
        default_sort_order: req.default_sort_order,
        default_forum_layout: req.default_forum_layout,
    };

    let channel = state
        .channel_service
        .create_channel(identity, guild_id, input)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(channel))
}
