use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::crypto::KeyBundle;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/keys/bundle/{user_id}")]
pub struct GetKeyBundleRoute {
    user_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/keys/bundle/{user_id}",
    tag = "crypto",
    summary = "Fetch a user's key bundle for initiating E2EE session",
    description = "Returns the user's identity key, signed pre-key, and consumes one one-time pre-key (if available). Used by clients to initiate X3DH key exchange.",
    params(("user_id" = Uuid, Path, description = "Target user ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = KeyBundle),
        (status = 404, description = "User has no keys", body = ApiError),
    )
)]
pub async fn get_key_bundle_handler(
    GetKeyBundleRoute { user_id }: GetKeyBundleRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
) -> Result<Response<KeyBundle>, ApiError> {
    let bundle = state
        .crypto_repository
        .fetch_key_bundle(user_id)
        .await
        .map_err(map_crypto_error)?;

    Ok(Response::OK(bundle))
}
