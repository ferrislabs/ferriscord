use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::user::domain::dm::ports::DmService;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/@me/{channel_id}/messages/{message_id}")]
pub struct DeleteDmMessageRoute {
    channel_id: Uuid,
    message_id: Uuid,
}

#[derive(PartialEq, Serialize, ToSchema)]
pub struct DeleteDmMessageResponse {
    message: String,
}

#[utoipa::path(
    delete,
    path = "/channels/@me/{channel_id}/messages/{message_id}",
    tag = "messages",
    summary = "Delete a DM message",
    params(
        ("channel_id" = Uuid, Path, description = "DM Channel ID"),
        ("message_id" = Uuid, Path, description = "Message ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = DeleteDmMessageResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden (not your message)", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn delete_dm_message_handler(
    DeleteDmMessageRoute { channel_id, message_id }: DeleteDmMessageRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DeleteDmMessageResponse>, ApiError> {
    let deleted = state
        .dm_service
        .delete_message(identity.id(), channel_id, message_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    if !deleted {
        return Err(ApiError::Unknown { message: "message not found or not yours".to_string() });
    }

    let room = format!("dm:{}", channel_id);
    if let Ok(payload) = serde_json::to_string(&serde_json::json!({
        "type": "message.delete",
        "room": room,
        "data": { "message_id": message_id, "channel_id": channel_id },
    })) {
        state.hub.publish(&room, payload).await;
    }

    Ok(Response::OK(DeleteDmMessageResponse { message: "message deleted".to_string() }))
}
