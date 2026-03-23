use axum::extract::{Extension, State};
use axum::http::StatusCode;
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, guild::GuildId, role::RoleId, user::UserId};
use ferriscord_error::ApiError;
use ferriscord_core::guild::domain::role::{entities::AssignRoleInput, ports::RoleService};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/members/{user_id}/roles/{role_id}")]
pub struct AssignMemberRoleRoute {
    pub guild_id: Uuid,
    pub user_id: Uuid,
    pub role_id: Uuid,
}

#[utoipa::path(
    put,
    path = "/guilds/{guild_id}/members/{user_id}/roles/{role_id}",
    tag = "roles",
    summary = "Assign a role to a guild member",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("user_id" = Uuid, Path, description = "User ID"),
        ("role_id" = Uuid, Path, description = "Role ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 204, description = "Role assigned"),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 404, description = "Not found", body = ApiError),
    )
)]
pub async fn assign_member_role_handler(
    AssignMemberRoleRoute { guild_id, user_id, role_id }: AssignMemberRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<StatusCode, ApiError> {
    state
        .role_service
        .assign_role(identity, AssignRoleInput {
            guild_id: GuildId(Id(guild_id)),
            user_id: UserId(Id(user_id)),
            role_id: RoleId(Id(role_id)),
        })
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(StatusCode::NO_CONTENT)
}
