use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;

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
        (status = 200, body = [String]),
        (status = 400, description = "Bad Request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError)
    )
)]
pub async fn get_user_guilds(
    _: GetUserGuildsRoute,
    State(_state): State<AppState>,
) -> Result<Response<Vec<String>>, ApiError> {
    todo!()
}
