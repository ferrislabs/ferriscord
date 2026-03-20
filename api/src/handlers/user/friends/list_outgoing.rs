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
#[typed_path("/friends/requests/outgoing")]
pub struct ListOutgoingRoute;

#[utoipa::path(
    get,
    path = "/friends/requests/outgoing",
    tag = "friends",
    summary = "List outgoing pending friend requests",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<Friendship>),
        (status = 401, body = ApiError),
    )
)]
pub async fn list_outgoing_handler(
    _: ListOutgoingRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<Friendship>>, ApiError> {
    let requests = state
        .user_service
        .list_outgoing(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(requests))
}
