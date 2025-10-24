use axum::extract::State;
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
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
) -> Result<Response<()>, ApiError> {
    todo!()
}
