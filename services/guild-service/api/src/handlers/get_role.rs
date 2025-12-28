use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::role::Role;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::role::{entities::FindRoleInput, ports::RoleService};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles/{role_id}")]
pub struct GetRoleRoute {
    guild_id: Uuid,
    role_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/roles/{role_id}",
    tag = "roles",
    summary = "Get a role from a guild",
    description = "Retrieves the specified role from the given guild.",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
        ("role_id" = String, Path, description = "Role ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, body = Role),
        (status = 400, description = "Bad Request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError)
    )
)]
pub async fn get_role_handler(
    GetRoleRoute { guild_id, role_id }: GetRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Role>, ApiError> {
    let role = state
        .service
        .find_role(
            identity,
            FindRoleInput {
                guild_id: guild_id.into(),
                role_id: role_id.into(),
            },
        )
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(role))
}
