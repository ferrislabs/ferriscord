use axum::{Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_core::guild::domain::invite::ports::InviteService;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/invites/{code}")]
pub struct PreviewInviteRoute {
    code: String,
}

#[derive(Serialize, ToSchema)]
pub struct InvitePreview {
    pub code: String,
    pub guild_id: String,
    pub guild_name: String,
    pub uses: i32,
    pub max_uses: Option<i32>,
    pub expires_at: Option<String>,
}

#[utoipa::path(
    get,
    path = "/invites/{code}",
    tag = "invites",
    summary = "Preview an invite",
    params(
        ("code" = String, Path, description = "Invite code"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "Invite preview", body = InvitePreview),
        (status = 404, description = "Invite not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn preview_invite_handler(
    PreviewInviteRoute { code }: PreviewInviteRoute,
    State(state): State<AppState>,
) -> Result<Json<InvitePreview>, ApiError> {
    let (invite, guild) = state
        .invite_service
        .preview_by_code(&code)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Json(InvitePreview {
        code: invite.code,
        guild_id: guild.id.get_uuid().to_string(),
        guild_name: guild.name,
        uses: invite.uses,
        max_uses: invite.max_uses,
        expires_at: invite.expires_at.map(|d| d.to_rfc3339()),
    }))
}
