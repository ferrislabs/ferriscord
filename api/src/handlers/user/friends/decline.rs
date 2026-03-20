use axum::{extract::{Extension, State}, http::StatusCode};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::friend::ports::FriendService;
use ferriscord_error::ApiError;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/friends/requests/{request_id}/decline")]
pub struct DeclineFriendRequestRoute {
    pub request_id: Uuid,
}

#[utoipa::path(
    patch,
    path = "/friends/requests/{request_id}/decline",
    tag = "friends",
    summary = "Decline a friend request",
    security(("Authorization" = ["Bearer"])),
    params(("request_id" = Uuid, Path, description = "Friend request ID")),
    responses(
        (status = 204),
        (status = 401, body = ApiError),
        (status = 404, description = "Request not found", body = ApiError),
    )
)]
pub async fn decline_friend_request_handler(
    DeclineFriendRequestRoute { request_id }: DeclineFriendRequestRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<StatusCode, ApiError> {
    state
        .user_service
        .decline(identity.id(), request_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(StatusCode::NO_CONTENT)
}
