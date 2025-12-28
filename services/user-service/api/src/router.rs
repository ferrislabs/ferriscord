use axum::Router;
use ferriscord_error::ApiError;
use tracing::info_span;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

use crate::{handlers::handlers_roites, openapi::ApiDoc, state::AppState};

pub fn router(state: AppState) -> Result<Router, ApiError> {
    let trace_layer = tower_http::trace::TraceLayer::new_for_http().make_span_with(
        |request: &axum::extract::Request| {
            let uri: String = request.uri().to_string();
            info_span!("http_request", method = ?request.method(), uri)
        },
    );

    let openapi = ApiDoc::openapi();

    let router = Router::new()
        .merge(Scalar::with_url("/scalar", openapi.clone()))
        .merge(handlers_roites(state.clone()))
        .layer(trace_layer)
        .with_state(state);

    Ok(router)
}
