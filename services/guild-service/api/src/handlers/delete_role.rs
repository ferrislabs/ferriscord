use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::role::{entities::DeleteRoleInput, ports::RoleService};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles/{role_id}")]
pub struct DeleteRoleRoute {
    guild_id: Uuid,
    role_id: Uuid,
}

#[derive(PartialEq, Serialize, ToSchema)]
pub struct DeleteRoleResponse {
    message: String,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/roles/{role_id}",
    tag = "roles",
    summary = "Delete a role from a guild",
    description = "Deletes the specified role from the given guild.",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
        ("role_id" = String, Path, description = "Role ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, body = DeleteRoleResponse),
        (status = 400, description = "Bad Request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError)
    )
)]
pub async fn delete_role_handler(
    DeleteRoleRoute { guild_id, role_id }: DeleteRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DeleteRoleResponse>, ApiError> {
    state
        .service
        .delete_role(
            identity,
            DeleteRoleInput {
                guild_id: guild_id.into(),
                role_id: role_id.into(),
            },
        )
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;
    Ok(Response::OK(DeleteRoleResponse {
        message: "role deleted".to_string(),
    }))
}
