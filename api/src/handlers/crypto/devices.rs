use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{DeviceInfo, RegisterDeviceRequest};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/devices")]
pub struct DevicesRoute;

#[utoipa::path(
    post,
    path = "/keys/devices",
    tag = "crypto",
    summary = "Register a new device",
    security(("Authorization" = ["Bearer"])),
    request_body = RegisterDeviceRequest,
    responses(
        (status = 201, body = DeviceInfo),
        (status = 401, description = "Unauthorized", body = ApiError),
    )
)]
pub async fn register_device_handler(
    _: DevicesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<RegisterDeviceRequest>,
) -> Result<Response<DeviceInfo>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let device = state
        .crypto_repository
        .register_device(user.id.0, body.device_name, body.public_key)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::Created(device))
}

#[utoipa::path(
    get,
    path = "/keys/devices",
    tag = "crypto",
    summary = "List caller's devices",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<DeviceInfo>),
        (status = 401, description = "Unauthorized", body = ApiError),
    )
)]
pub async fn list_devices_handler(
    _: DevicesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<DeviceInfo>>, ApiError> {
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

    Ok(Response::OK(devices))
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/devices/{device_id}")]
pub struct DeleteDeviceRoute {
    device_id: Uuid,
}

#[utoipa::path(
    delete,
    path = "/keys/devices/{device_id}",
    tag = "crypto",
    summary = "Delete a device",
    params(("device_id" = Uuid, Path, description = "Device ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, description = "Deleted"),
        (status = 404, description = "Not found", body = ApiError),
    )
)]
pub async fn delete_device_handler(
    DeleteDeviceRoute { device_id }: DeleteDeviceRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<()>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let deleted = state
        .crypto_repository
        .delete_device(user.id.0, device_id)
        .await
        .map_err(map_crypto_error)?;

    if !deleted {
        return Err(ApiError::NotFound { message: "device not found".into() });
    }

    Ok(Response::OK(()))
}
