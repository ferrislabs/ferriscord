use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::invite::ports::InviteService;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/invites/{invite_id}")]
pub struct DeleteInviteRoute {
    guild_id: Uuid,
    invite_id: Uuid,
}

#[derive(PartialEq, Serialize, ToSchema)]
pub struct DeleteInviteResponse {
    message: String,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/invites/{invite_id}",
    tag = "invites",
    summary = "Delete an invite",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
        ("invite_id" = String, Path, description = "Invite ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, body = DeleteInviteResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Invite not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn delete_invite_handler(
    DeleteInviteRoute { guild_id, invite_id }: DeleteInviteRoute,
    State(state): State<AppState>,
) -> Result<Response<DeleteInviteResponse>, ApiError> {
    state
        .invite_service
        .delete(invite_id, &guild_id.into())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(DeleteInviteResponse {
        message: "invite deleted".to_string(),
    }))
}
