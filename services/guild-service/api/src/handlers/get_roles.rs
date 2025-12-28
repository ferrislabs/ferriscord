use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_entities::role::Role;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(PartialEq, Serialize, ToSchema)]
pub struct GetRolesResponse {
    pub data: Vec<Role>,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles")]
pub struct GetRolesRoute {
    guild_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/roles",
    tag = "roles",
    summary = "Get all roles in a guild",
    description = "Retrieves a list of all roles in the specified guild.",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, body = GetRolesResponse),
        (status = 400, description = "Bad Request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError)
    )
)]
pub async fn get_roles_handler(
    GetRolesRoute { guild_id }: GetRolesRoute,
    State(_state): State<AppState>,
) -> Result<Response<GetRolesResponse>, ApiError> {
    println!("get roles handler: {:?}", guild_id);
    todo!()
}
