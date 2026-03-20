use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::friend::ports::FriendService;
use ferriscord_entities::friendship::Friendship;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/friends")]
pub struct ListFriendsRoute;

#[utoipa::path(
    get,
    path = "/friends",
    tag = "friends",
    summary = "List accepted friends",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<Friendship>),
        (status = 401, body = ApiError),
    )
)]
pub async fn list_friends_handler(
    _: ListFriendsRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<Friendship>>, ApiError> {
    let friends = state
        .user_service
        .list_friends(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(friends))
}
