use axum::{Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::{
    guild::entities::GuildId,
    role::{
        entities::{CreateRoleInput, Role},
        ports::RoleService,
    },
};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles")]
pub struct CreateRoleRoute {
    guild_id: Uuid,
}

#[derive(Deserialize)]
pub struct CreateRoleRequest {
    pub color: u32,
    pub name: String,
    pub permissions: u64,
}

pub async fn create_role_handler(
    CreateRoleRoute { guild_id }: CreateRoleRoute,
    State(state): State<AppState>,
    Json(req): Json<CreateRoleRequest>,
) -> Result<Response<Role>, ApiError> {
    let role = state
        .service
        .create_role(
            CreateRoleInput {
                name: req.name,
                permissions: req.permissions,
            },
            guild_id.into(),
        )
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(role))
}
