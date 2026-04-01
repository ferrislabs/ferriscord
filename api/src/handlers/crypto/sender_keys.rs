use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_entities::crypto::{DistributeSenderKeyRequest, SenderKeyDistribution};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use uuid::Uuid;

use ferriscord_core::crypto::domain::ports::CryptoKeyRepository;

use crate::state::AppState;

use super::super::map_crypto_error;

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/{channel_id}/sender-keys")]
pub struct SenderKeysRoute {
    channel_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/channels/{channel_id}/sender-keys",
    tag = "crypto",
    summary = "Distribute sender keys for a channel",
    params(("channel_id" = Uuid, Path, description = "Channel ID")),
    security(("Authorization" = ["Bearer"])),
    request_body = DistributeSenderKeyRequest,
    responses(
        (status = 200, description = "Sender keys distributed"),
    )
)]
pub async fn distribute_sender_keys_handler(
    SenderKeysRoute { channel_id }: SenderKeysRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<DistributeSenderKeyRequest>,
) -> Result<Response<()>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    let distributions: Vec<(Uuid, Vec<u8>, Vec<u8>)> = body
        .distributions
        .into_iter()
        .map(|d| (d.recipient_device_id, d.encrypted_key, d.nonce))
        .collect();

    state
        .crypto_repository
        .distribute_sender_key(channel_id, user.id.0, body.generation, distributions)
        .await
        .map_err(map_crypto_error)?;

    // Notify channel members that sender keys have been updated
    let room = format!("channel:{}", channel_id);
    if let Ok(payload) = serde_json::to_string(&serde_json::json!({
        "type": "keys.updated",
        "room": room,
        "data": {
            "channel_id": channel_id,
            "sender_user_id": user.id.0,
            "generation": body.generation,
        }
    })) {
        state.hub.publish(&room, payload).await;
    }

    Ok(Response::OK(()))
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/{channel_id}/sender-keys/@me")]
pub struct GetSenderKeysRoute {
    channel_id: Uuid,
}

#[utoipa::path(
    get,
    path = "/channels/{channel_id}/sender-keys/@me",
    tag = "crypto",
    summary = "Get sender key distributions for caller's devices",
    params(("channel_id" = Uuid, Path, description = "Channel ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<SenderKeyDistribution>),
    )
)]
pub async fn get_sender_keys_handler(
    GetSenderKeysRoute { channel_id }: GetSenderKeysRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<Vec<SenderKeyDistribution>>, ApiError> {
    let user = state
        .user_service
        .get_me(identity.id())
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound { message: "user not found".into() })?;

    // Get all devices for this user, then fetch sender keys for each
    let devices = state
        .crypto_repository
        .list_devices(user.id.0)
        .await
        .map_err(map_crypto_error)?;

    let mut all_keys = Vec::new();
    for device in devices {
        let keys = state
            .crypto_repository
            .get_sender_keys_for_device(channel_id, device.id)
            .await
            .map_err(map_crypto_error)?;
        all_keys.extend(keys);
    }

    Ok(Response::OK(all_keys))
}
