use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{CreateDmSessionRequest, DmSessionInfo, UpdateDmSessionRequest};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/{channel_id}/session")]
pub struct DmSessionRoute {
    channel_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/dm/{channel_id}/session",
    tag = "crypto",
    summary = "Create or initialize a DM E2EE session",
    params(("channel_id" = Uuid, Path, description = "DM channel ID")),
    security(("Authorization" = ["Bearer"])),
    request_body = CreateDmSessionRequest,
    responses(
        (status = 201, body = DmSessionInfo),
    )
)]
pub async fn create_dm_session_handler(
    DmSessionRoute { channel_id }: DmSessionRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
    Json(body): Json<CreateDmSessionRequest>,
) -> Result<Response<DmSessionInfo>, ApiError> {
    let session = state
        .crypto_repository
        .upsert_dm_session(
            channel_id,
            body.device_id,
            body.encrypted_ratchet_state,
            body.ephemeral_public_key,
        )
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::Created(session))
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/{channel_id}/session/{device_id}")]
pub struct GetDmSessionRoute {
    channel_id: Uuid,
    device_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/dm/{channel_id}/session/{device_id}",
    tag = "crypto",
    summary = "Get DM session for a specific device",
    params(
        ("channel_id" = Uuid, Path, description = "DM channel ID"),
        ("device_id" = Uuid, Path, description = "Device ID"),
    ),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = DmSessionInfo),
        (status = 404, description = "Session not found", body = ApiError),
    )
)]
pub async fn get_dm_session_handler(
    GetDmSessionRoute { channel_id, device_id }: GetDmSessionRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
) -> Result<Response<DmSessionInfo>, ApiError> {
    let session = state
        .crypto_repository
        .get_dm_session(channel_id, device_id)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(session))
}

#[utoipa::path(
    put,
    path = "/dm/{channel_id}/session",
    tag = "crypto",
    summary = "Update DM session ratchet state",
    params(("channel_id" = Uuid, Path, description = "DM channel ID")),
    security(("Authorization" = ["Bearer"])),
    request_body = UpdateDmSessionRequest,
    responses(
        (status = 200, body = DmSessionInfo),
    )
)]
pub async fn update_dm_session_handler(
    DmSessionRoute { channel_id }: DmSessionRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UpdateDmSessionRequest>,
) -> Result<Response<DmSessionInfo>, ApiError> {
    // Resolve user's active device - for now use the first device
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let devices = state
        .crypto_repository
        .list_devices(user.id.0)
        .await
        .map_err(map_crypto_error)?;

    let device = devices
        .first()
        .ok_or_else(|| ApiError::NotFound { message: "no device registered".into() })?;

    let session = state
        .crypto_repository
        .upsert_dm_session(
            channel_id,
            device.id,
            body.encrypted_ratchet_state,
            body.ephemeral_public_key,
        )
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(session))
}
