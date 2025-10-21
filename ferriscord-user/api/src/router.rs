use axum::Router;
use tracing::info_span;

use crate::{errors::ApiError, state::AppState};

pub fn router(state: AppState) -> Result<Router, ApiError> {
    let trace_layer = tower_http::trace::TraceLayer::new_for_http().make_span_with(
        |request: &axum::extract::Request| {
            let uri: String = request.uri().to_string();
            info_span!("http_request", method = ?request.method(), uri)
        },
    );

    let router = Router::new().layer(trace_layer).with_state(state);

    Ok(router)
}
