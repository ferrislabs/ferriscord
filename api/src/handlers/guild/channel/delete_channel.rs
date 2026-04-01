use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::guild::domain::channel::ports::ChannelService;
use ferriscord_entities::{Id, channel::ChannelId, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}")]
pub struct DeleteChannelRoute {
    guild_id: Uuid,
    channel_id: Uuid,
}

#[derive(Serialize, PartialEq, ToSchema)]
pub struct DeleteChannelResponse {
    pub message: String,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/channels/{channel_id}",
    tag = "channels",
    summary = "Delete a guild channel",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = DeleteChannelResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 404, description = "Channel not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn delete_channel_handler(
    DeleteChannelRoute {
        guild_id,
        channel_id,
    }: DeleteChannelRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DeleteChannelResponse>, ApiError> {
    state
        .channel_service
        .delete_channel(identity, GuildId(Id(guild_id)), ChannelId(Id(channel_id)))
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(DeleteChannelResponse {
        message: "channel deleted".to_string(),
    }))
}
