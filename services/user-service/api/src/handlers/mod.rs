use axum::{
    Router,
    extract::{Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::Response,
};
use axum_extra::routing::RouterExt;
use ferriscord_server::http::auth_middleware;

use crate::{handlers::get_user_guilds::get_user_guilds, state::AppState};

pub mod get_user_guilds;

async fn service_auth_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    auth_middleware(State(state.service), req, next).await
}

pub fn handlers_roites(state: AppState) -> Router<AppState> {
    Router::new()
        .typed_get(get_user_guilds)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            service_auth_middleware,
        ))
}
