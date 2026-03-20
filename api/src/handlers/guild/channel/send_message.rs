use std::time::Duration;

use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, attachment::AttachmentId, channel::ChannelId, guild::GuildId, message::Message};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::message::ports::{AttachmentInput, MessageService};
use ferriscord_storage::StoragePort;
use serde::Deserialize;
use tracing::error;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}/messages")]
pub struct SendMessageRoute {
    guild_id: Uuid,
    channel_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/guilds/{guild_id}/channels/{channel_id}/messages",
    tag = "messages",
    summary = "Send a message",
    description = "Sends a message (with optional file attachments) to a text channel. Requires SEND_MESSAGES permission. Use multipart/form-data: `content` field for text, `files` fields for attachments.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 201, description = "Message sent", body = Message),
        (status = 400, description = "Invalid request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Missing SEND_MESSAGES permission", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn send_message_handler(
    SendMessageRoute { guild_id, channel_id }: SendMessageRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    mut multipart: axum::extract::Multipart,
) -> Result<Response<Message>, ApiError> {
    let guild_id = GuildId(Id(guild_id));
    let channel_id = ChannelId(Id(channel_id));

    let mut content = String::new();
    let mut attachment_inputs: Vec<AttachmentInput> = Vec::new();
    let bucket = &state.args.storage.bucket;

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::Unknown {
        message: format!("multipart error: {}", e),
    })? {
        let field_name = field.name().unwrap_or("").to_string();

        if field_name == "content" {
            content = field.text().await.map_err(|e| ApiError::Unknown {
                message: format!("failed to read content field: {}", e),
            })?;
        } else if field_name == "files" {
            let filename = field
                .file_name()
                .unwrap_or("file")
                .to_string();
            let content_type = field
                .content_type()
                .unwrap_or("application/octet-stream")
                .to_string();

            let data = field.bytes().await.map_err(|e| ApiError::Unknown {
                message: format!("failed to read file '{}': {}", filename, e),
            })?;
            let size_bytes = data.len() as i64;

            let id = AttachmentId::new();
            let storage_key = format!(
                "attachments/{}/{}",
                channel_id.get_uuid(),
                id.get_uuid()
            );

            state
                .storage
                .put_object(bucket, &storage_key, data, &content_type)
                .await
                .map_err(|e| {
                    error!("failed to upload attachment '{}': {}", filename, e);
                    ApiError::Unknown {
                        message: format!("failed to upload attachment: {}", e),
                    }
                })?;

            attachment_inputs.push(AttachmentInput {
                id,
                filename,
                content_type,
                size_bytes,
                storage_key,
            });
        }
    }

    let mut message = state
        .message_service
        .send_message(identity, guild_id, channel_id, content, attachment_inputs)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    // Populate presigned URLs for all attachments
    for attachment in &mut message.attachments {
        attachment.url = state
            .storage
            .presigned_get_url(bucket, &attachment.storage_key, Duration::from_secs(3600))
            .await
            .map_err(|e| {
                error!("failed to generate presigned URL for '{}': {}", attachment.storage_key, e);
                ApiError::Unknown {
                    message: format!("failed to generate attachment URL: {}", e),
                }
            })?;
    }

    Ok(Response::Created(message))
}
