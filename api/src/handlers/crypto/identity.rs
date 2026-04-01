use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{IdentityKeyInfo, UploadIdentityKeyRequest};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/identity")]
pub struct UploadIdentityKeyRoute;

#[utoipa::path(
    post,
    path = "/keys/identity",
    tag = "crypto",
    summary = "Upload identity public key",
    security(("Authorization" = ["Bearer"])),
    request_body = UploadIdentityKeyRequest,
    responses(
        (status = 200, description = "Identity key stored"),
        (status = 401, description = "Unauthorized", body = ApiError),
    )
)]
pub async fn upload_identity_key_handler(
    _: UploadIdentityKeyRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UploadIdentityKeyRequest>,
) -> Result<Response<()>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    state
        .crypto_repository
        .upsert_identity_key(user.id.0, body.public_key)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(()))
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/identity/{user_id}")]
pub struct GetIdentityKeyRoute {
    user_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/keys/identity/{user_id}",
    tag = "crypto",
    summary = "Get a user's identity public key",
    params(("user_id" = Uuid, Path, description = "User ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = IdentityKeyInfo),
        (status = 404, description = "Not found", body = ApiError),
    )
)]
pub async fn get_identity_key_handler(
    GetIdentityKeyRoute { user_id }: GetIdentityKeyRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
) -> Result<Response<IdentityKeyInfo>, ApiError> {
    let info = state
        .crypto_repository
        .get_identity_key(user_id)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(info))
}
