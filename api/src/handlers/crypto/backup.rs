use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{KeyBackup, UploadKeyBackupRequest};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/backup")]
pub struct KeyBackupRoute;

#[utoipa::path(
    put,
    path = "/keys/backup",
    tag = "crypto",
    summary = "Upload encrypted key backup",
    security(("Authorization" = ["Bearer"])),
    request_body = UploadKeyBackupRequest,
    responses(
        (status = 200, description = "Backup stored"),
    )
)]
pub async fn upsert_key_backup_handler(
    _: KeyBackupRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UploadKeyBackupRequest>,
) -> Result<Response<()>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    state
        .crypto_repository
        .upsert_key_backup(
            user.id.0,
            body.encrypted_blob,
            body.salt,
            body.nonce,
            body.recovery_codes,
        )
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(()))
}

#[utoipa::path(
    get,
    path = "/keys/backup",
    tag = "crypto",
    summary = "Download encrypted key backup",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = KeyBackup),
        (status = 404, description = "No backup found", body = ApiError),
    )
)]
pub async fn get_key_backup_handler(
    _: KeyBackupRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<KeyBackup>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let backup = state
        .crypto_repository
        .get_key_backup(user.id.0)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(backup))
}
