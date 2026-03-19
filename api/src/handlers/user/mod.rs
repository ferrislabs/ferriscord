use axum::Router;
use axum_extra::routing::RouterExt;

use crate::{handlers::user::get_user_guilds::get_user_guilds, state::AppState};

pub mod get_user_guilds;

pub fn user_routes(state: AppState) -> Router<AppState> {
    Router::new().typed_get(get_user_guilds)
}
