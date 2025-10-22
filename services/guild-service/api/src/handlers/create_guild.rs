use axum::{Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use guild_core::domain::{
    Id,
    guild::{
        entities::{CreateGuildInput, Guild, OwnerId},
        ports::GuildService,
    },
};
use serde::Deserialize;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/guilds")]
pub struct CreateGuildRoute;

#[derive(Deserialize)]
pub struct CreateGuildRequest {
    name: String,
}

pub async fn create_guild_handler(
    _: CreateGuildRoute,
    State(state): State<AppState>,
    Json(req): Json<CreateGuildRequest>,
) -> Result<Response<Guild>, ApiError> {
    let guild = state
        .service
        .create_guild(CreateGuildInput {
            name: req.name,
            owner_id: OwnerId(Id::new()),
        })
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(guild))
}
