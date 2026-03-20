use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::invite::Invite;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::invite::ports::InviteService;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/invites")]
pub struct CreateInviteRoute {
    guild_id: Uuid,
}

#[derive(Deserialize, ToSchema)]
pub struct CreateInviteRequest {
    expires_in_hours: Option<u32>,
    max_uses: Option<u32>,
}

#[utoipa::path(
    post,
    path = "/guilds/{guild_id}/invites",
    tag = "invites",
    summary = "Create an invite for a guild",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
    ),
    request_body = CreateInviteRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 201, description = "Invite created", body = Invite),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Guild not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn create_invite_handler(
    CreateInviteRoute { guild_id }: CreateInviteRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreateInviteRequest>,
) -> Result<Response<Invite>, ApiError> {
    let invite = state
        .invite_service
        .create(
            identity.id(),
            &guild_id.into(),
            req.expires_in_hours,
            req.max_uses,
        )
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::Created(invite))
}
