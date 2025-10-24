use axum::{Router, extract::State, http::StatusCode, middleware::Next, response::Response};
use axum_extra::routing::RouterExt;
use ferriscord_error::ApiError;
use ferriscord_server::http::auth_middleware;
use tracing::info_span;

use crate::{
    handlers::{
        create_guild::create_guild_handler, create_role::create_role_handler,
        get_role::get_role_handler,
    },
    state::AppState,
};

async fn service_auth_middleware(
    State(state): State<AppState>,
    req: axum::extract::Request,
    next: Next,
) -> Result<Response, StatusCode> {
    auth_middleware(State(state.service), req, next).await
}

pub fn router(state: AppState) -> Result<Router, ApiError> {
    let trace_layer = tower_http::trace::TraceLayer::new_for_http().make_span_with(
        |request: &axum::extract::Request| {
            let uri: String = request.uri().to_string();
            info_span!("http_request", method = ?request.method(), uri)
        },
    );

    let router = Router::new()
        .typed_post(create_guild_handler)
        .typed_get(get_role_handler)
        .typed_post(create_role_handler)
        .layer(trace_layer)
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            service_auth_middleware,
        ))
        .with_state(state);

    Ok(router)
}
