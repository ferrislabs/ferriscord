use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::user::domain::user::{UserId, ports::UserService};
use serde::Deserialize;
use uuid::Uuid;

use crate::{handlers::user::get_me::UserProfile, state::AppState};

#[derive(TypedPath, Deserialize)]
#[typed_path("/users/{user_id}")]
pub struct GetUserRoute {
    pub user_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/users/{user_id}",
    tag = "users",
    summary = "Get a user's public profile",
    security(("Authorization" = ["Bearer"])),
    params(
        ("user_id" = Uuid, Path, description = "User ID"),
    ),
    responses(
        (status = 200, body = UserProfile),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "User not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn get_user_handler(
    GetUserRoute { user_id }: GetUserRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
) -> Result<Response<UserProfile>, ApiError> {
    let user = state
        .user_service
        .get_profile(UserId(user_id))
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::Unknown { message: "user not found".into() })?;

    Ok(Response::OK(UserProfile {
        id: user.id.0,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        banner_url: user.banner_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }))
}
