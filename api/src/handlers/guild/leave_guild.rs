use axum::extract::State;
use axum::http::StatusCode;
use axum::Extension;
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, guild::GuildId, user::UserId};
use ferriscord_error::{ApiError, ApiErrorResponse};
use ferriscord_core::guild::domain::guild::ports::GuildService;
use ferriscord_core::user::domain::user::ports::UserService;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, serde::Deserialize)]
#[typed_path("/guilds/{guild_id}/members/@me")]
pub struct LeaveGuildRoute {
    guild_id: Uuid,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/members/@me",
    tag = "members",
    summary = "Leave a guild",
    description = "Leave a guild. The guild owner cannot leave their own guild.",
    params(("guild_id" = Uuid, Path, description = "Guild ID")),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 204, description = "Left guild successfully"),
        (status = 400, description = "Bad Request", body = ApiErrorResponse),
        (status = 401, description = "Unauthorized", body = ApiErrorResponse),
        (status = 403, description = "Forbidden — owner cannot leave", body = ApiErrorResponse),
        (status = 404, description = "Guild not found", body = ApiErrorResponse),
        (status = 500, description = "Internal Server Error", body = ApiErrorResponse),
    )
)]
pub async fn leave_guild_handler(
    LeaveGuildRoute { guild_id }: LeaveGuildRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<StatusCode, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::Unknown { message: "user not found".into() })?;

    let user_id = UserId::from(user.id.0);
    let guild_id = GuildId(Id(guild_id));

    state
        .guild_service
        .leave_guild(identity, &guild_id, user_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(StatusCode::NO_CONTENT)
}
