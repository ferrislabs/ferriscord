use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::guild::domain::role::{entities::UpdateRoleInput, ports::RoleService};
use ferriscord_entities::{Id, guild::GuildId, role::Role, role::RoleId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles/{role_id}")]
pub struct UpdateRoleRoute {
    guild_id: Uuid,
    role_id: Uuid,
}

#[derive(Deserialize, ToSchema)]
pub struct UpdateRoleRequest {
    pub color: u32,
    pub permissions: u64,
    pub name: String,
}

#[utoipa::path(
    patch,
    path = "/guilds/{guild_id}/roles/{role_id}",
    tag = "roles",
    summary = "Update a role in a guild",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("role_id" = Uuid, Path, description = "Role ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    request_body(
        content = UpdateRoleRequest,
        description = "Role update request payload",
        content_type = "application/json",
    ),
    responses(
        (status = 200, body = Role),
        (status = 400, description = "Bad Request"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden"),
        (status = 500, description = "Internal Server Error")
    )
)]
pub async fn update_role_handler(
    UpdateRoleRoute { guild_id, role_id }: UpdateRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<UpdateRoleRequest>,
) -> Result<Response<Role>, ApiError> {
    let role = state
        .role_service
        .update_role(
            identity,
            UpdateRoleInput {
                guild_id: GuildId(Id(guild_id)),
                role_id: RoleId(Id(role_id)),
                name: req.name,
                permissions: req.permissions,
                color: Some(req.color),
            },
        )
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(role))
}
