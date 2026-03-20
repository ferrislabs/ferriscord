use std::time::Duration;

use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::dm::ports::{DmAttachmentInput, DmService};
use ferriscord_entities::{Id, attachment::AttachmentId, message::Message};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_storage::StoragePort;
use serde::Deserialize;
use tracing::error;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/channels/@me/{channel_id}/messages")]
pub struct SendDmMessageRoute {
    pub channel_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/channels/@me/{channel_id}/messages",
    tag = "dms",
    summary = "Send a DM message",
    security(("Authorization" = ["Bearer"])),
    params(("channel_id" = Uuid, Path, description = "DM channel ID")),
    responses(
        (status = 201, body = Message),
        (status = 401, body = ApiError),
        (status = 404, description = "Channel not found or not a participant", body = ApiError),
    )
)]
pub async fn send_dm_message_handler(
    SendDmMessageRoute { channel_id }: SendDmMessageRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    mut multipart: axum::extract::Multipart,
) -> Result<Response<Message>, ApiError> {
    let bucket = &state.args.storage.bucket;
    let mut content = String::new();
    let mut attachment_inputs: Vec<DmAttachmentInput> = Vec::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::Unknown {
        message: format!("multipart error: {}", e),
    })? {
        match field.name().unwrap_or("") {
            "content" => {
                content = field.text().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read content: {}", e),
                })?;
            }
            "files" => {
                let filename = field
                    .file_name()
                    .unwrap_or("file")
                    .to_string();
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();
                let data = field.bytes().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read file: {}", e),
                })?;

                if data.is_empty() {
                    continue;
                }

                let attachment_id = AttachmentId(Id::new());
                let storage_key = format!("dm_attachments/{}/{}", channel_id, attachment_id.get_uuid());

                state
                    .storage
                    .put_object(bucket, &storage_key, data, &content_type)
                    .await
                    .map_err(|e| {
                        error!("failed to upload DM attachment: {}", e);
                        ApiError::Unknown {
                            message: format!("failed to upload attachment: {}", e),
                        }
                    })?;

                attachment_inputs.push(DmAttachmentInput {
                    id: attachment_id,
                    filename,
                    content_type,
                    size_bytes: 0, // filled below after upload
                    storage_key,
                });
            }
            _ => {}
        }
    }

    let mut message = state
        .user_service
        .send_message(identity.id(), channel_id, content, attachment_inputs)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    // Populate presigned URLs
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

    Ok(Response::Created(message))
}
