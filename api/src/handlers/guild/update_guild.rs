use std::time::Duration;

use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::guild::{Guild, GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::{errors::CoreError, guild::{entities::UpdateGuildInput, ports::GuildService}};
use ferriscord_storage::StoragePort;
use serde::Deserialize;
use tracing::error;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}")]
pub struct UpdateGuildRoute {
    pub guild_id: Uuid,
}

#[utoipa::path(
    patch,
    path = "/guilds/{guild_id}",
    tag = "guilds",
    summary = "Update guild settings",
    description = "Updates guild name, icon, banner, and/or banner color. Send as multipart/form-data.",
    params(("guild_id" = Uuid, Path, description = "Guild ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Guild),
        (status = 400, description = "Bad request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 404, description = "Not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn update_guild_handler(
    UpdateGuildRoute { guild_id }: UpdateGuildRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    mut multipart: axum::extract::Multipart,
) -> Result<Response<Guild>, ApiError> {
    let bucket = &state.args.storage.bucket;

    let mut name: Option<String> = None;
    let mut new_icon_url: Option<String> = None;
    let mut new_banner_url: Option<String> = None;
    let mut banner_color: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::BadRequest {
        message: format!("invalid multipart request: {}", e),
    })? {
        match field.name().unwrap_or("") {
            "name" => {
                let value = field.text().await.map_err(|e| ApiError::BadRequest {
                    message: format!("failed to read name field: {}", e),
                })?;
                let trimmed = value.trim().to_string();
                if !trimmed.is_empty() {
                    name = Some(trimmed);
                }
            }
            "banner_color" => {
                let value = field.text().await.map_err(|e| ApiError::BadRequest {
                    message: format!("failed to read banner_color field: {}", e),
                })?;
                let trimmed = value.trim().to_string();
                banner_color = Some(trimmed);
            }
            "icon" => {
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest {
                    message: format!("failed to read icon field: {}", e),
                })?;
                if data.is_empty() {
                    continue;
                }
                let storage_key = format!("guild-icons/{}", guild_id);
                state
                    .storage
                    .put_object(bucket, &storage_key, data, &content_type)
                    .await
                    .map_err(|e| {
                        error!("failed to upload guild icon: {}", e);
                        ApiError::Unknown { message: format!("failed to upload icon: {}", e) }
                    })?;
                let url = state
                    .storage
                    .presigned_get_url(bucket, &storage_key, Duration::from_secs(7 * 24 * 3600))
                    .await
                    .map_err(|e| {
                        error!("failed to generate presigned URL for guild icon: {}", e);
                        ApiError::Unknown { message: format!("failed to generate icon URL: {}", e) }
                    })?;
                new_icon_url = Some(url);
            }
            "banner" => {
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest {
                    message: format!("failed to read banner field: {}", e),
                })?;
                if data.is_empty() {
                    continue;
                }
                let storage_key = format!("guild-banners/{}", guild_id);
                state
                    .storage
                    .put_object(bucket, &storage_key, data, &content_type)
                    .await
                    .map_err(|e| {
                        error!("failed to upload guild banner: {}", e);
                        ApiError::Unknown { message: format!("failed to upload banner: {}", e) }
                    })?;
                let url = state
                    .storage
                    .presigned_get_url(bucket, &storage_key, Duration::from_secs(7 * 24 * 3600))
                    .await
                    .map_err(|e| {
                        error!("failed to generate presigned URL for guild banner: {}", e);
                        ApiError::Unknown { message: format!("failed to generate banner URL: {}", e) }
                    })?;
                new_banner_url = Some(url);
            }
            _ => {}
        }
    }

    let banner_color_db = banner_color.map(|c| if c.is_empty() { None } else { Some(c) }).flatten();

    let guild = state
        .guild_service
        .update_guild(
            identity,
            UpdateGuildInput {
                guild_id: GuildId::from(guild_id),
                name,
                icon_url: new_icon_url,
                banner_url: new_banner_url,
                banner_color: banner_color_db,
            },
        )
        .await
        .map_err(|e| match e {
            CoreError::GuildNotFound { guild_id } => ApiError::NotFound {
                message: format!("guild {} not found", guild_id),
            },
            CoreError::InsufficientPermissions => ApiError::Forbidden {
                message: "only the guild owner can update guild settings".to_string(),
            },
            CoreError::GuildSlugAlreadyExists { slug } => ApiError::BadRequest {
                message: format!("a guild with the name '{}' already exists", slug),
            },
            e => {
                error!("failed to update guild: {}", e);
                ApiError::Unknown {
                    message: "failed to update guild".to_string(),
                }
            }
        })?;

    Ok(Response::OK(guild))
}
