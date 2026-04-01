use axum::Router;
use axum_extra::routing::RouterExt;

use crate::state::AppState;

pub mod backup;
pub mod bundle;
pub mod devices;
pub mod dm_session;
pub mod identity;
pub mod prekeys;
pub mod sender_keys;

pub fn crypto_routes(_state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(identity::upload_identity_key_handler)
        .typed_get(identity::get_identity_key_handler)
        .typed_post(devices::register_device_handler)
        .typed_get(devices::list_devices_handler)
        .typed_delete(devices::delete_device_handler)
        .typed_post(prekeys::upload_signed_prekey_handler)
        .typed_post(prekeys::upload_onetime_prekeys_handler)
        .typed_get(bundle::get_key_bundle_handler)
        .typed_put(backup::upsert_key_backup_handler)
        .typed_get(backup::get_key_backup_handler)
        .typed_post(sender_keys::distribute_sender_keys_handler)
        .typed_get(sender_keys::get_sender_keys_handler)
        .typed_post(dm_session::create_dm_session_handler)
        .typed_get(dm_session::get_dm_session_handler)
        .typed_put(dm_session::update_dm_session_handler)
}
