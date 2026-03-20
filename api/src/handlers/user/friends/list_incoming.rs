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
#[typed_path("/friends/requests/incoming")]
pub struct ListIncomingRoute;

#[utoipa::path(
    get,
    path = "/friends/requests/incoming",
    tag = "friends",
    summary = "List incoming pending friend requests",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<Friendship>),
        (status = 401, body = ApiError),
    )
)]
pub async fn list_incoming_handler(
    _: ListIncomingRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<Friendship>>, ApiError> {
    let requests = state
        .user_service
        .list_incoming(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(requests))
}
