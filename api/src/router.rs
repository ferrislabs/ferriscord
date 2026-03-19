use axum::{
    Router,
    http::{
        HeaderValue, Method,
        header::{self, ACCEPT, AUTHORIZATION, CONTENT_LENGTH, CONTENT_TYPE, LOCATION},
    },
    response::IntoResponse,
    routing::get,
};
use ferriscord_error::ApiError;
use tower_http::cors::CorsLayer;
use tracing::info_span;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

use crate::{handlers::handlers_routes, openapi::ApiDoc, state::AppState};

async fn openapi_json() -> impl IntoResponse {
    let json = ApiDoc::openapi().to_json().unwrap_or_default();
    (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/json"),
        )],
        json,
    )
}

async fn openapi_yaml() -> impl IntoResponse {
    let yaml = ApiDoc::openapi().to_yaml().unwrap_or_default();
    (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/yaml"),
        )],
        yaml,
    )
}

pub fn router(state: AppState) -> Result<Router, ApiError> {
    let trace_layer = tower_http::trace::TraceLayer::new_for_http().make_span_with(
        |request: &axum::extract::Request| {
            let uri: String = request.uri().to_string();
            info_span!("http_request", method = ?request.method(), uri)
        },
    );

    let openapi = ApiDoc::openapi();

    let allowed_origins = state
        .args
        .server
        .allowed_origins
        .iter()
        .map(|origin| HeaderValue::from_str(origin).unwrap())
        .collect::<Vec<HeaderValue>>();

    let cors_layer = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::DELETE,
            Method::PUT,
            Method::PATCH,
            Method::OPTIONS,
        ])
        .allow_origin(allowed_origins)
        .allow_headers([
            AUTHORIZATION,
            CONTENT_TYPE,
            CONTENT_LENGTH,
            ACCEPT,
            LOCATION,
        ])
        .allow_credentials(true);

    let router = Router::new()
        .merge(Scalar::with_url("/scalar", openapi.clone()))
        .route("/openapi.json", get(openapi_json))
        .route("/openapi.yaml", get(openapi_yaml))
        .merge(handlers_routes(state.clone()))
        .layer(cors_layer)
        .layer(trace_layer)
        .with_state(state);

    Ok(router)
}
