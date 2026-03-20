use axum::Router;
use axum_extra::routing::RouterExt;

use crate::state::AppState;

pub mod accept;
pub mod decline;
pub mod list_friends;
pub mod list_incoming;
pub mod list_outgoing;
pub mod remove;
pub mod send_request;

use accept::accept_friend_request_handler;
use decline::decline_friend_request_handler;
use list_friends::list_friends_handler;
use list_incoming::list_incoming_handler;
use list_outgoing::list_outgoing_handler;
use remove::remove_friend_handler;
use send_request::send_friend_request_handler;

pub fn friend_routes(_state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(send_friend_request_handler)
        .typed_get(list_friends_handler)
        .typed_get(list_incoming_handler)
        .typed_get(list_outgoing_handler)
        .typed_patch(accept_friend_request_handler)
        .typed_patch(decline_friend_request_handler)
        .typed_delete(remove_friend_handler)
}
