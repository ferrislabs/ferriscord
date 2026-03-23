use std::time::Duration;

use axum::extract::{Extension, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_storage::StoragePort;
use serde::Deserialize;
use tracing::error;

use crate::{handlers::user::get_me::UserProfile, state::AppState};

#[derive(TypedPath, Deserialize)]
#[typed_path("/users/@me")]
pub struct UpdateProfileRoute;

#[utoipa::path(
    patch,
    path = "/users/@me",
    tag = "users",
    summary = "Update current user profile",
    description = "Updates display name and/or avatar. Send as multipart/form-data: `display_name` (text) and `avatar` (file, optional).",
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = UserProfile),
        (status = 400, description = "Bad request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn update_profile_handler(
    _: UpdateProfileRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    mut multipart: axum::extract::Multipart,
) -> Result<Response<UserProfile>, ApiError> {
    let sub = identity.id();
    let bucket = &state.args.storage.bucket;

    let mut display_name: Option<String> = None;
    let mut new_avatar_url: Option<String> = None;
    let mut bio: Option<String> = None;
    let mut new_banner_url: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::Unknown {
        message: format!("multipart error: {}", e),
    })? {
        match field.name().unwrap_or("") {
            "display_name" => {
                let value = field.text().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read display_name: {}", e),
                })?;
                // Empty string → None (clears the display name)
                display_name = Some(if value.trim().is_empty() {
                    String::new()
                } else {
                    value.trim().to_string()
                });
            }
            "bio" => {
                let value = field.text().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read bio: {}", e),
                })?;
                bio = Some(value.trim().to_string());
            }
            "avatar" => {
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();

                let data = field.bytes().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read avatar: {}", e),
                })?;

                if data.is_empty() {
                    continue;
                }

                // Use a stable key per user so the same slot is always overwritten
                let storage_key = format!("avatars/{}", sub);

                state
                    .storage
                    .put_object(bucket, &storage_key, data, &content_type)
                    .await
                    .map_err(|e| {
                        error!("failed to upload avatar for '{}': {}", sub, e);
                        ApiError::Unknown {
                            message: format!("failed to upload avatar: {}", e),
                        }
                    })?;

                // 7-day presigned URL stored in DB
                let url = state
                    .storage
                    .presigned_get_url(bucket, &storage_key, Duration::from_secs(7 * 24 * 3600))
                    .await
                    .map_err(|e| {
                        error!("failed to generate presigned URL for avatar: {}", e);
                        ApiError::Unknown {
                            message: format!("failed to generate avatar URL: {}", e),
                        }
                    })?;

                new_avatar_url = Some(url);
            }
            "banner" => {
                let content_type = field
                    .content_type()
                    .unwrap_or("application/octet-stream")
                    .to_string();

                let data = field.bytes().await.map_err(|e| ApiError::Unknown {
                    message: format!("failed to read banner: {}", e),
                })?;

                if data.is_empty() {
                    continue;
                }

                let storage_key = format!("banners/{}", sub);

                state
                    .storage
                    .put_object(bucket, &storage_key, data, &content_type)
                    .await
                    .map_err(|e| {
                        error!("failed to upload banner for '{}': {}", sub, e);
                        ApiError::Unknown {
                            message: format!("failed to upload banner: {}", e),
                        }
                    })?;

                let url = state
                    .storage
                    .presigned_get_url(bucket, &storage_key, Duration::from_secs(7 * 24 * 3600))
                    .await
                    .map_err(|e| {
                        error!("failed to generate presigned URL for banner: {}", e);
                        ApiError::Unknown {
                            message: format!("failed to generate banner URL: {}", e),
                        }
                    })?;

                new_banner_url = Some(url);
            }
            _ => {}
        }
    }

    // Resolve empty display_name string → None (NULL in DB)
    let display_name_db = display_name.map(|d| if d.is_empty() { None } else { Some(d) }).flatten();
    // Resolve empty bio string → None (NULL in DB)
    let bio_db = bio.map(|b| if b.is_empty() { None } else { Some(b) }).flatten();

    let user = state
        .user_service
        .update_profile(sub, display_name_db, new_avatar_url, bio_db, new_banner_url)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(UserProfile {
        id: user.id.0,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        banner_url: user.banner_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }))
}
