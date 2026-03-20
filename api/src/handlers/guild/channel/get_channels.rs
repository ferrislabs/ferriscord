use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::guild::domain::channel::ports::ChannelService;
use ferriscord_entities::{Id, channel::Channel, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels")]
pub struct GetChannelsRoute {
    guild_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/channels",
    tag = "channels",
    summary = "Get guild channels",
    description = "Returns all channels for the specified guild.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "List of channels", body = Vec<Channel>),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Guild not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn get_channels_handler(
    GetChannelsRoute { guild_id }: GetChannelsRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<Channel>>, ApiError> {
    let guild_id = GuildId(Id(guild_id));

    let channels = state
        .channel_service
        .get_guild_channels(identity, guild_id)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(channels))
}
