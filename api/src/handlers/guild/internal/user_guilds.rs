#![allow(dead_code)]

use axum::extract::{Query, State};
use axum_extra::routing::TypedPath;
use ferriscord_entities::{guild::Guild, user::UserId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;

use crate::state::AppState;

#[derive(TypedPath)]
#[typed_path("/internal/guilds")]
pub struct InternalGetUserGuildsRoute;

#[derive(Debug, Deserialize)]
pub struct InternalGetUserGuildsQuery {
    user_id: UserId,
}

pub async fn internal_get_user_guilds(
    _: InternalGetUserGuildsRoute,
    State(_state): State<AppState>,
    Query(_query): Query<InternalGetUserGuildsQuery>,
) -> Result<Response<Vec<Guild>>, ApiError> {
    todo!()
}
