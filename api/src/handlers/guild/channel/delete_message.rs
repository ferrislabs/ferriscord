use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, channel::ChannelId, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::message::ports::MessageService;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}/messages/{message_id}")]
pub struct DeleteMessageRoute {
    guild_id: Uuid,
    channel_id: Uuid,
    message_id: Uuid,
}

#[derive(PartialEq, Serialize, ToSchema)]
pub struct DeleteMessageResponse {
    message: String,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/channels/{channel_id}/messages/{message_id}",
    tag = "messages",
    summary = "Delete a message",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
        ("message_id" = Uuid, Path, description = "Message ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = DeleteMessageResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden (not your message)", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn delete_message_handler(
    DeleteMessageRoute { guild_id, channel_id, message_id }: DeleteMessageRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DeleteMessageResponse>, ApiError> {
    state
        .message_service
        .delete_message(
            identity,
            GuildId(Id(guild_id)),
            ChannelId(Id(channel_id)),
            message_id,
        )
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let room = format!("channel:{}", channel_id);
    if let Ok(payload) = serde_json::to_string(&serde_json::json!({
        "type": "message.delete",
        "room": room,
        "data": { "message_id": message_id, "channel_id": channel_id },
    })) {
        state.hub.publish(&room, payload).await;
    }

    Ok(Response::OK(DeleteMessageResponse { message: "message deleted".to_string() }))
}
