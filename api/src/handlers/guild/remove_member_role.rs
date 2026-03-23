use axum::extract::{Extension, State};
use axum::http::StatusCode;
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, guild::GuildId, role::RoleId, user::UserId};
use ferriscord_error::ApiError;
use ferriscord_core::guild::domain::role::{entities::RemoveRoleInput, ports::RoleService};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/members/{user_id}/roles/{role_id}")]
pub struct RemoveMemberRoleRoute {
    pub guild_id: Uuid,
    pub user_id: Uuid,
    pub role_id: Uuid,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}/members/{user_id}/roles/{role_id}",
    tag = "roles",
    summary = "Remove a role from a guild member",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("user_id" = Uuid, Path, description = "User ID"),
        ("role_id" = Uuid, Path, description = "Role ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 204, description = "Role removed"),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
    )
)]
pub async fn remove_member_role_handler(
    RemoveMemberRoleRoute { guild_id, user_id, role_id }: RemoveMemberRoleRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<StatusCode, ApiError> {
    state
        .role_service
        .remove_role(identity, RemoveRoleInput {
            guild_id: GuildId(Id(guild_id)),
            user_id: UserId(Id(user_id)),
            role_id: RoleId(Id(role_id)),
        })
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(StatusCode::NO_CONTENT)
}
