use axum::extract::{Extension, Json, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::dm::ports::DmService;
use ferriscord_entities::friendship::DmChannel;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/channels/@me")]
pub struct CreateOrGetDmRoute;

#[derive(Deserialize, ToSchema)]
pub struct CreateOrGetDmBody {
    pub recipient_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/channels/@me",
    tag = "dms",
    summary = "Create or get a DM channel",
    security(("Authorization" = ["Bearer"])),
    request_body = CreateOrGetDmBody,
    responses(
        (status = 200, body = DmChannel),
        (status = 401, body = ApiError),
        (status = 404, description = "Recipient not found", body = ApiError),
    )
)]
pub async fn create_or_get_dm_handler(
    _: CreateOrGetDmRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<CreateOrGetDmBody>,
) -> Result<Response<DmChannel>, ApiError> {
    let dm = state
        .user_service
        .create_or_get(identity.id(), body.recipient_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(dm))
}
