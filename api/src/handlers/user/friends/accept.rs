use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::friend::ports::FriendService;
use ferriscord_entities::friendship::Friendship;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/friends/requests/{request_id}/accept")]
pub struct AcceptFriendRequestRoute {
    pub request_id: Uuid,
}

#[utoipa::path(
    patch,
    path = "/friends/requests/{request_id}/accept",
    tag = "friends",
    summary = "Accept a friend request",
    security(("Authorization" = ["Bearer"])),
    params(("request_id" = Uuid, Path, description = "Friend request ID")),
    responses(
        (status = 200, body = Friendship),
        (status = 401, body = ApiError),
        (status = 404, description = "Request not found", body = ApiError),
    )
)]
pub async fn accept_friend_request_handler(
    AcceptFriendRequestRoute { request_id }: AcceptFriendRequestRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Friendship>, ApiError> {
    let friendship = state
        .user_service
        .accept(identity.id(), request_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(friendship))
}
