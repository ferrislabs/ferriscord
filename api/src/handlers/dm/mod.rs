use axum::Router;
use axum_extra::routing::RouterExt;

use crate::state::AppState;

pub mod create_or_get;
pub mod delete_message;
pub mod get_messages;
pub mod history_sync;
pub mod list_dms;
pub mod send_message;

use create_or_get::create_or_get_dm_handler;
use delete_message::delete_dm_message_handler;
use get_messages::get_dm_messages_handler;
use history_sync::{
    complete_dm_history_sync_job_handler, create_dm_history_sync_job_handler,
    fail_dm_history_sync_job_handler, get_dm_history_sync_job_handler,
    list_dm_history_sync_messages_handler, upload_dm_history_sync_payloads_handler,
};
use list_dms::list_dms_handler;
use send_message::send_dm_message_handler;

pub fn dm_routes(_state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(create_or_get_dm_handler)
        .typed_get(list_dms_handler)
        .typed_get(get_dm_messages_handler)
        .typed_post(send_dm_message_handler)
        .typed_delete(delete_dm_message_handler)
        .typed_post(create_dm_history_sync_job_handler)
        .typed_get(get_dm_history_sync_job_handler)
        .typed_get(list_dm_history_sync_messages_handler)
        .typed_post(upload_dm_history_sync_payloads_handler)
        .typed_put(complete_dm_history_sync_job_handler)
        .typed_put(fail_dm_history_sync_job_handler)
}
