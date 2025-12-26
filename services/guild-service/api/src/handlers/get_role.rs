use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::role::{
    entities::{FindRoleInput, Role},
    ports::RoleService,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles/{role_id}")]
pub struct GetRoleRoute {
    guild_id: Uuid,
    role_id: Uuid,
}

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
