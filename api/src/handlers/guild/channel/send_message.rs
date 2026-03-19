use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, channel::ChannelId, guild::GuildId, message::Message};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::message::ports::MessageService;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}/messages")]
pub struct SendMessageRoute {
    guild_id: Uuid,
    channel_id: Uuid,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SendMessageRequest {
    pub content: String,
}

#[utoipa::path(
    post,
    path = "/guilds/{guild_id}/channels/{channel_id}/messages",
    tag = "messages",
    summary = "Send a message",
    description = "Sends a message to a text channel. Requires SEND_MESSAGES permission.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
    ),
    request_body = SendMessageRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 201, description = "Message sent", body = Message),
        (status = 400, description = "Invalid request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Missing SEND_MESSAGES permission", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn send_message_handler(
    SendMessageRoute { guild_id, channel_id }: SendMessageRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<SendMessageRequest>,
) -> Result<Response<Message>, ApiError> {
    let guild_id = GuildId(Id(guild_id));
    let channel_id = ChannelId(Id(channel_id));

    let message = state
        .guild_service
        .send_message(identity, guild_id, channel_id, req.content)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(message))
}
