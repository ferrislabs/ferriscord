use utoipa::OpenApi;

use super::handlers::{
    guild::{
        channel::{
            create_channel::__path_create_channel_handler,
            get_channels::__path_get_channels_handler,
            get_messages::__path_get_messages_handler,
            send_message::__path_send_message_handler,
        },
        create_guild::__path_create_guild_handler,
        create_role::__path_create_role_handler,
        delete_guild::__path_delete_guild_handler,
        delete_role::__path_delete_role_handler,
        get_role::__path_get_role_handler,
        get_roles::__path_get_roles_handler,
        invite::{
            create_invite::__path_create_invite_handler,
            delete_invite::__path_delete_invite_handler,
            join_guild::__path_join_guild_handler,
            list_invites::__path_list_invites_handler,
            preview_invite::__path_preview_invite_handler,
        },
    },
    user::{
        get_me::__path_get_me_handler,
        get_user_guilds::__path_get_user_guilds,
        update_profile::__path_update_profile_handler,
    },
};

#[derive(OpenApi)]
#[openapi(
    info(title = "FerrisCord API"),
    paths(
        create_guild_handler,
        delete_guild_handler,
        create_role_handler,
        delete_role_handler,
        get_role_handler,
        get_roles_handler,
        get_channels_handler,
        create_channel_handler,
        get_messages_handler,
        send_message_handler,
        create_invite_handler,
        list_invites_handler,
        delete_invite_handler,
        join_guild_handler,
        preview_invite_handler,
        get_user_guilds,
        get_me_handler,
        update_profile_handler,
    )
)]
pub struct ApiDoc;
