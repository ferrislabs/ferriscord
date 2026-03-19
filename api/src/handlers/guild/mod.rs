use axum::Router;
use axum_extra::routing::RouterExt;

use crate::{
    handlers::guild::{
        channel::{
            create_channel::create_channel_handler,
            get_channels::get_channels_handler,
            get_messages::get_messages_handler,
            send_message::send_message_handler,
        },
        create_guild::create_guild_handler,
        create_role::create_role_handler,
        delete_guild::delete_guild_handler,
        delete_role::delete_role_handler,
        get_role::get_role_handler,
        get_roles::get_roles_handler,
    },
    state::AppState,
};

pub mod channel;
pub mod create_guild;
pub mod create_role;
pub mod delete_guild;
pub mod delete_role;
pub mod get_role;
pub mod get_roles;
pub mod internal;
pub mod update_guild;

pub fn guild_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .typed_post(create_guild_handler)
        .typed_get(get_roles_handler)
        .typed_get(get_role_handler)
        .typed_post(create_role_handler)
        .typed_delete(delete_role_handler)
        .typed_delete(delete_guild_handler)
        .typed_get(get_channels_handler)
        .typed_post(create_channel_handler)
        .typed_get(get_messages_handler)
        .typed_post(send_message_handler)
}
