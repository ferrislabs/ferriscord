use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use chrono::{DateTime, Utc};
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::user::domain::user::ports::UserService;
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/users/@me")]
pub struct GetMeRoute;

#[derive(Debug, Serialize, PartialEq, ToSchema)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[utoipa::path(
    get,
    path = "/users/@me",
    tag = "users",
    summary = "Get current user profile",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = UserProfile),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "User not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn get_me_handler(
    _: GetMeRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<UserProfile>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::Unknown { message: "user not found".into() })?;

    Ok(Response::OK(UserProfile {
        id: user.id.0,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }))
}
