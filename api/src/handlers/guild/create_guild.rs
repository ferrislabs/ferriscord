use axum::{Extension, Json, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::guild::{Guild, OwnerId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::guild::{entities::CreateGuildInput, ports::GuildService};
use serde::Deserialize;
use utoipa::ToSchema;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/guilds")]
pub struct CreateGuildRoute;

#[derive(Deserialize, ToSchema)]
pub struct CreateGuildRequest {
    name: String,
}

#[utoipa::path(
    post,
    path = "/guilds",
    tag = "guilds",
    summary = "Create a new guild",
    description = "Creates a new guild with the specified name.",
    request_body = CreateGuildRequest,
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 201, description = "Guild created", body = Guild),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Forbidden", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn create_guild_handler(
    _: CreateGuildRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreateGuildRequest>,
) -> Result<Response<Guild>, ApiError> {
    let owner_id: OwnerId = identity.id().into();

    let guild = state
        .guild_service
        .create_guild(CreateGuildInput {
            name: req.name,
            owner_id,
        })
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::Created(guild))
}
