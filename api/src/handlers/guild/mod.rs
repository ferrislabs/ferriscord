use axum::Router;
use axum_extra::routing::RouterExt;

use crate::{
    handlers::guild::{
        channel::{
            create_channel::create_channel_handler,
            delete_message::delete_message_handler,
            get_channels::get_channels_handler,
            get_messages::get_messages_handler,
            send_message::send_message_handler,
        },
        create_guild::create_guild_handler,
        create_role::create_role_handler,
        delete_guild::delete_guild_handler,
        delete_role::delete_role_handler,
        get_members::get_members_handler,
        leave_guild::leave_guild_handler,
        get_role::get_role_handler,
        get_roles::get_roles_handler,
        invite::{
            create_invite::create_invite_handler,
            delete_invite::delete_invite_handler,
            join_guild::join_guild_handler,
            list_invites::list_invites_handler,
            preview_invite::preview_invite_handler,
        },
    },
    state::AppState,
};

pub mod channel;
pub mod create_guild;
pub mod create_role;
pub mod delete_guild;
pub mod delete_role;
pub mod get_members;
pub mod leave_guild;
pub mod get_role;
pub mod get_roles;
pub mod internal;
pub mod invite;
pub mod update_guild;

pub fn guild_routes(_state: AppState) -> Router<AppState> {
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
        .typed_delete(delete_message_handler)
        .typed_post(join_guild_handler)
        .typed_post(create_invite_handler)
        .typed_get(list_invites_handler)
        .typed_delete(delete_invite_handler)
        .typed_get(preview_invite_handler)
        .typed_get(get_members_handler)
        .typed_delete(leave_guild_handler)
}
