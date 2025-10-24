use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles/{role_id}")]
pub struct DeleteRoleRoute {
    guild_id: Uuid,
    role_id: Uuid,
}

#[derive(PartialEq, Serialize)]
pub struct DeleteRoleResponse {
    message: String,
}

pub async fn delete_role_handler(
    DeleteRoleRoute { guild_id, role_id }: DeleteRoleRoute,
    State(state): State<AppState>,
) -> Result<Response<DeleteRoleResponse>, ApiError> {
    todo!()
}
