use axum::Router;
use axum_extra::routing::RouterExt;

use crate::state::AppState;

pub mod create_or_get;
pub mod get_messages;
pub mod list_dms;
pub mod send_message;

use create_or_get::create_or_get_dm_handler;
use get_messages::get_dm_messages_handler;
use list_dms::list_dms_handler;
use send_message::send_dm_message_handler;

pub fn dm_routes(_state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(create_or_get_dm_handler)
        .typed_get(list_dms_handler)
        .typed_get(get_dm_messages_handler)
        .typed_post(send_dm_message_handler)
}
