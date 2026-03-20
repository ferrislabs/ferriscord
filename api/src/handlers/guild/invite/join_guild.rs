use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{guild::Guild, user::UserId as EntityUserId};
use ferriscord_error::ApiError;
use ferriscord_core::guild::domain::invite::ports::InviteService;
use ferriscord_core::user::domain::user::ports::UserService;
use serde::Deserialize;
use utoipa::ToSchema;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/guilds/join")]
pub struct JoinGuildRoute;

#[derive(Deserialize, ToSchema)]
pub struct JoinGuildRequest {
    code: String,
}

#[utoipa::path(
    post,
    path = "/guilds/join",
    tag = "invites",
    summary = "Join a guild via invite code",
    request_body = JoinGuildRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "Joined guild", body = Guild),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Invite not found", body = ApiError),
        (status = 410, description = "Invite expired or max uses reached", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn join_guild_handler(
    _: JoinGuildRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<JoinGuildRequest>,
) -> Result<Json<Guild>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::Unknown { message: "user not found".into() })?;

    let entity_user_id = EntityUserId::from(user.id.0);
    let guild = state
        .invite_service
        .join_by_code(identity.id(), &entity_user_id, &req.code)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Json(guild))
}
