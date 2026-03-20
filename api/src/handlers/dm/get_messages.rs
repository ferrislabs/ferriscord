use std::time::Duration;

use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::dm::ports::DmService;
use ferriscord_entities::message::Message;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_storage::StoragePort;
use serde::Deserialize;
use tracing::error;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/@me/{channel_id}/messages")]
pub struct GetDmMessagesRoute {
    pub channel_id: Uuid,
}

#[derive(Debug, Deserialize, IntoParams)]
pub struct GetDmMessagesQuery {
    pub before: Option<Uuid>,
    pub limit: Option<u32>,
}

#[utoipa::path(
    get,
    path = "/channels/@me/{channel_id}/messages",
    tag = "dms",
    summary = "Get DM messages",
    security(("Authorization" = ["Bearer"])),
    params(
        ("channel_id" = Uuid, Path, description = "DM channel ID"),
        GetDmMessagesQuery,
    ),
    responses(
        (status = 200, body = Vec<Message>),
        (status = 401, body = ApiError),
        (status = 404, description = "Channel not found or not a participant", body = ApiError),
    )
)]
pub async fn get_dm_messages_handler(
    GetDmMessagesRoute { channel_id }: GetDmMessagesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    axum::extract::Query(query): axum::extract::Query<GetDmMessagesQuery>,
) -> Result<Response<Vec<Message>>, ApiError> {
    let limit = query.limit.unwrap_or(50);

    let mut messages = state
        .dm_service
        .get_messages(identity.id(), channel_id, query.before, limit)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let bucket = &state.args.storage.bucket;
    for message in &mut messages {
        for attachment in &mut message.attachments {
            match state
                .storage
                .presigned_get_url(bucket, &attachment.storage_key, Duration::from_secs(3600))
                .await
            {
                Ok(url) => attachment.url = url,
                Err(e) => {
                    error!(
                        "failed to generate presigned URL for '{}': {}",
                        attachment.storage_key, e
                    );
                }
            }
        }
    }

    Ok(Response::OK(messages))
}
