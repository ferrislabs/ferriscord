use axum::{
    Router,
    extract::{Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::Response,
};
use axum_extra::routing::RouterExt;
use ferriscord_server::http::auth_middleware;

use crate::{
    handlers::{
        create_guild::create_guild_handler, create_role::create_role_handler,
        delete_guild::delete_guild_handler, delete_role::delete_role_handler,
        get_role::get_role_handler, get_roles::get_roles_handler,
    },
    state::AppState,
};

pub mod create_guild;
pub mod create_role;
pub mod delete_guild;
pub mod delete_role;
pub mod get_role;
pub mod get_roles;
pub mod update_guild;

async fn service_auth_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    auth_middleware(State(state.service), req, next).await
}

pub fn handlers_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(create_guild_handler)
        .typed_get(get_roles_handler)
        .typed_get(get_role_handler)
        .typed_post(create_role_handler)
        .typed_delete(delete_role_handler)
        .typed_delete(delete_guild_handler)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            service_auth_middleware,
        ))
}
