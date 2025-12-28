use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::guild::GuildId;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::guild::ports::GuildService;
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}")]
pub struct DeleteGuildRoute {
    pub guild_id: Uuid,
}

#[utoipa::path(
    delete,
    path = "/guilds/{guild_id}",
    tag = "guilds",
    summary = "Delete a guild",
    description = "Deletes the specified guild.",
    params(
        ("guild_id" = String, Path, description = "Guild ID"),
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 204, description = "No Content"),
        (status = 400, description = "Bad Request", body = ApiError),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal Server Error", body = ApiError)
    )
)]
pub async fn delete_guild_handler(
    DeleteGuildRoute { guild_id }: DeleteGuildRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<()>, ApiError> {
    let guild_id: GuildId = guild_id.into();
    state
        .service
        .delete_guild(identity, &guild_id)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;
    todo!()
}
