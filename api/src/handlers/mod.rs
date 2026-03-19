use axum::{
    Router,
    extract::{Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::Response,
};
use ferriscord_server::http::auth_middleware;

pub mod guild;
pub mod user;

async fn service_auth_middleware(
    State(state): State<crate::state::AppState>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    auth_middleware(State(state), req, next).await
}

pub fn handlers_routes(state: crate::state::AppState) -> Router<crate::state::AppState> {
    Router::new()
        .merge(guild::guild_routes(state.clone()))
        .merge(user::user_routes(state.clone()))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            service_auth_middleware,
        ))
}
