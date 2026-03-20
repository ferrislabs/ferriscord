use axum::{extract::{Extension, State}, http::StatusCode};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::friend::ports::FriendService;
use ferriscord_error::ApiError;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/friends/{user_id}")]
pub struct RemoveFriendRoute {
    pub user_id: Uuid,
}

#[utoipa::path(
    delete,
    path = "/friends/{user_id}",
    tag = "friends",
    summary = "Remove a friend",
    security(("Authorization" = ["Bearer"])),
    params(("user_id" = Uuid, Path, description = "Friend's user ID")),
    responses(
        (status = 204),
        (status = 401, body = ApiError),
        (status = 404, description = "Not friends", body = ApiError),
    )
)]
pub async fn remove_friend_handler(
    RemoveFriendRoute { user_id }: RemoveFriendRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<StatusCode, ApiError> {
    state
        .friend_service
        .remove(identity.id(), user_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(StatusCode::NO_CONTENT)
}
