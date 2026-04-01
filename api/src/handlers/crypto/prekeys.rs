use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{UploadOneTimePreKeysRequest, UploadSignedPreKeyRequest};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/signed-prekey")]
pub struct SignedPreKeyRoute;

#[derive(Serialize, PartialEq, ToSchema)]
pub struct SignedPreKeyResponse {
    pub id: uuid::Uuid,
}

#[utoipa::path(
    post,
    path = "/keys/signed-prekey",
    tag = "crypto",
    summary = "Upload a signed pre-key",
    security(("Authorization" = ["Bearer"])),
    request_body = UploadSignedPreKeyRequest,
    responses(
        (status = 200, body = SignedPreKeyResponse),
    )
)]
pub async fn upload_signed_prekey_handler(
    _: SignedPreKeyRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UploadSignedPreKeyRequest>,
) -> Result<Response<SignedPreKeyResponse>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let id = state
        .crypto_repository
        .upsert_signed_prekey(user.id.0, body.public_key, body.signature)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(SignedPreKeyResponse { id }))
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/onetime-prekeys")]
pub struct OneTimePreKeysRoute;

#[derive(Serialize, PartialEq, ToSchema)]
pub struct OneTimePreKeysResponse {
    pub uploaded: u32,
    pub available: u32,
    /// Server-assigned IDs for each uploaded prekey, in order.
    pub ids: Vec<uuid::Uuid>,
}

#[utoipa::path(
    post,
    path = "/keys/onetime-prekeys",
    tag = "crypto",
    summary = "Upload a batch of one-time pre-keys",
    security(("Authorization" = ["Bearer"])),
    request_body = UploadOneTimePreKeysRequest,
    responses(
        (status = 200, body = OneTimePreKeysResponse),
    )
)]
pub async fn upload_onetime_prekeys_handler(
    _: OneTimePreKeysRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UploadOneTimePreKeysRequest>,
) -> Result<Response<OneTimePreKeysResponse>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let prekeys: Vec<Vec<u8>> = body.prekeys.into_iter().map(|p| p.public_key).collect();
    let ids = state
        .crypto_repository
        .upload_onetime_prekeys(user.id.0, prekeys)
        .await
        .map_err(map_crypto_error)?;

    let uploaded = ids.len() as u32;
    let available = state
        .crypto_repository
        .count_available_onetime_prekeys(user.id.0)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(OneTimePreKeysResponse { uploaded, available, ids }))
}
