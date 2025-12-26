use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::role::entities::Role;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;

#[derive(PartialEq, Serialize)]
pub struct GetRolesResponse {
    pub data: Vec<Role>,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/roles")]
pub struct GetRolesRoute {
    guild_id: Uuid,
}

pub async fn get_roles_handler(
    GetRolesRoute { guild_id }: GetRolesRoute,
    State(_state): State<AppState>,
) -> Result<Response<GetRolesResponse>, ApiError> {
    println!("get roles handler: {:?}", guild_id);
    todo!()
}
