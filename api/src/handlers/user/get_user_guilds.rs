use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{guild::Guild, user::UserId};
use ferriscord_error::{ApiError, ApiErrorResponse};
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::guild::ports::GuildService;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/users/@me/guilds")]
pub struct GetUserGuildsRoute;

#[utoipa::path(
    get,
    path = "/users/@me/guilds",
    tag = "users",
    summary = "Get user's guilds",
    description = "Retrieves the list of guilds the authenticated user is a member of.",
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, body = [Guild]),
        (status = 400, description = "Bad Request", body = ApiErrorResponse),
        (status = 401, description = "Unauthorized", body = ApiErrorResponse),
        (status = 403, description = "Forbidden", body = ApiErrorResponse),
        (status = 500, description = "Internal Server Error", body = ApiErrorResponse)
    )
)]
pub async fn get_user_guilds(
    _: GetUserGuildsRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<Guild>>, ApiError> {
    let user_id: UserId = identity
        .id()
        .parse::<Uuid>()
        .map_err(|e| ApiError::Unknown {
            message: format!("invalid user id: {e}"),
        })?
        .into();

    let guilds = state
        .guild_service
        .get_user_guilds(identity, user_id)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(guilds))
}
