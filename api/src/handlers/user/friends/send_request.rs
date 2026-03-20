use axum::extract::{Extension, Json, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::friend::ports::FriendService;
use ferriscord_entities::friendship::Friendship;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use utoipa::ToSchema;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/friends/requests")]
pub struct SendFriendRequestRoute;

#[derive(Deserialize, ToSchema)]
pub struct SendFriendRequestBody {
    pub username: String,
}

#[utoipa::path(
    post,
    path = "/friends/requests",
    tag = "friends",
    summary = "Send a friend request",
    security(("Authorization" = ["Bearer"])),
    request_body = SendFriendRequestBody,
    responses(
        (status = 201, body = Friendship),
        (status = 400, body = ApiError),
        (status = 401, body = ApiError),
        (status = 404, description = "User not found", body = ApiError),
        (status = 409, description = "Already friends or request pending", body = ApiError),
    )
)]
pub async fn send_friend_request_handler(
    _: SendFriendRequestRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<SendFriendRequestBody>,
) -> Result<Response<Friendship>, ApiError> {
    let friendship = state
        .friend_service
        .send_request(identity.id(), &body.username)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::Created(friendship))
}
