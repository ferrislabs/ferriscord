use axum::Router;
use axum_extra::routing::RouterExt;

use crate::{
    handlers::user::{
        get_me::get_me_handler,
        get_user_guilds::get_user_guilds,
        update_profile::update_profile_handler,
    },
    state::AppState,
};

pub mod get_me;
pub mod get_user_guilds;
pub mod update_profile;

pub fn user_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .typed_get(get_user_guilds)
        .typed_get(get_me_handler)
        .typed_patch(update_profile_handler)
}
