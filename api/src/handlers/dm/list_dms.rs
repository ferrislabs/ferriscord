use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::dm::ports::DmService;
use ferriscord_entities::friendship::DmChannel;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/@me")]
pub struct ListDmsRoute;

#[utoipa::path(
    get,
    path = "/channels/@me",
    tag = "dms",
    summary = "List DM channels",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<DmChannel>),
        (status = 401, body = ApiError),
    )
)]
pub async fn list_dms_handler(
    _: ListDmsRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<DmChannel>>, ApiError> {
    let dms = state
        .user_service
        .list(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(dms))
}
