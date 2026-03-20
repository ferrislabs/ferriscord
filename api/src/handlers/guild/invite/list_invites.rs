use axum::{Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_entities::invite::Invite;
use ferriscord_error::ApiError;
use ferriscord_core::guild::domain::invite::ports::InviteService;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/invites")]
pub struct ListInvitesRoute {
    guild_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/invites",
    tag = "invites",
    summary = "List invites for a guild",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "List of invites", body = Vec<Invite>),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Guild not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn list_invites_handler(
    ListInvitesRoute { guild_id }: ListInvitesRoute,
    State(state): State<AppState>,
) -> Result<Json<Vec<Invite>>, ApiError> {
    let invites = state
        .invite_service
        .list(&guild_id.into())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Json(invites))
}
