use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::role::{
    entities::FindRolesInput,
    ports::RoleService,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(PartialEq, Serialize, ToSchema)]
pub struct GetRolesResponse {
    pub data: Vec<RoleResponse>,
}

#[derive(PartialEq, Serialize, ToSchema)]
pub struct RoleResponse {
    pub id: Uuid,
    pub name: String,
    pub color: u32,
    pub position: i32,
    pub permissions: u64,
    pub hoist: bool,
    pub mentionable: bool,
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
    params(("guild_id" = Uuid, Path, description = "Guild ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = GetRolesResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError),
    )
)]
pub async fn get_roles_handler(
    GetRolesRoute { guild_id }: GetRolesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<GetRolesResponse>, ApiError> {
    let result = state
        .role_service
        .find_roles(identity, FindRolesInput { guild_id: GuildId(Id(guild_id)), per_page: Some(100), page: Some(1) })
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let data = result.data.into_iter().map(|r| RoleResponse {
        id: r.id.0.get_uuid(),
        name: r.name,
        color: r.color,
        position: r.position,
        permissions: r.permissions.bits(),
        hoist: r.hoist,
        mentionable: r.mentionable,
    }).collect();

    Ok(Response::OK(GetRolesResponse { data }))
}
