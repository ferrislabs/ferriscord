use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::guild::{entities::GuildId, ports::GuildService};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}")]
pub struct DeleteGuildRoute {
    guild_id: Uuid,
}

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
