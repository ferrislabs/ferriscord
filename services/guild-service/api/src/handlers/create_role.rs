use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::role::Role;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::role::{entities::CreateRoleInput, ports::RoleService};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles")]
pub struct CreateRoleRoute {
    guild_id: Uuid,
}

#[derive(Deserialize, ToSchema)]
pub struct CreateRoleRequest {
    pub color: u32,
    pub permissions: u64,
    pub name: String,
}

#[utoipa::path(
    post,
    path = "/guilds/{guild_id}/roles",
    tag = "roles",
    summary = "Create a new role in a guild",
    description = "Creates a new role with the specified attributes in the given guild.",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    request_body(
        content = CreateRoleRequest,
        description = "Role creation request payload",
        content_type = "application/json",
    ),
    responses(
        (status = 201, body = Role),
        (status = 400, description = "Bad Request"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden"),
        (status = 500, description = "Internal Server Error")
    )
)]
pub async fn create_role_handler(
    CreateRoleRoute { guild_id }: CreateRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreateRoleRequest>,
) -> Result<Response<Role>, ApiError> {
    let role = state
        .service
        .create_role(
            identity,
            CreateRoleInput {
                name: req.name,
                permissions: req.permissions,
                color: Some(req.color),
            },
            guild_id.into(),
        )
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(role))
}
