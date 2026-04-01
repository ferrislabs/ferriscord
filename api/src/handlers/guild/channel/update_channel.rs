use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::guild::domain::channel::{
    entities::UpdateChannelInput, ports::ChannelService,
};
use ferriscord_entities::{
    Id,
    channel::{Channel, ChannelId, PermissionOverwrite},
    guild::GuildId,
};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}")]
pub struct UpdateChannelRoute {
    guild_id: Uuid,
    channel_id: Uuid,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateChannelRequest {
    pub parent_id: Option<Uuid>,
    pub position: i32,
    pub name: Option<String>,
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
}

#[utoipa::path(
    patch,
    path = "/guilds/{guild_id}/channels/{channel_id}",
    tag = "channels",
    summary = "Update a guild channel",
    description = "Updates a channel's position and/or parent category. Requires MANAGE_CHANNELS permission.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
    ),
    request_body = UpdateChannelRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "Channel updated", body = Channel),
        (status = 400, description = "Invalid request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Missing MANAGE_CHANNELS permission", body = ApiError),
        (status = 404, description = "Guild or channel not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn update_channel_handler(
    UpdateChannelRoute {
        guild_id,
        channel_id,
    }: UpdateChannelRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<UpdateChannelRequest>,
) -> Result<Response<Channel>, ApiError> {
    let guild_id = GuildId(Id(guild_id));
    let channel_id = ChannelId(Id(channel_id));

    let input = UpdateChannelInput {
        parent_id: req.parent_id.map(|id| ChannelId(Id(id))),
        position: req.position,
        name: req.name,
        permission_overwrites: req.permission_overwrites,
    };

    let channel = state
        .channel_service
        .update_channel(identity, guild_id.clone(), channel_id, input)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    let guild_room = format!("guild:{}", guild_id.get_uuid());
    if let Ok(payload) = serde_json::to_string(&serde_json::json!({
        "type": "channel.updated",
        "room": guild_room,
        "data": {
            "channel_id": channel.id.get_uuid(),
        },
    })) {
        state.hub.publish(&guild_room, payload).await;
    }

    Ok(Response::OK(channel))
}
