use utoipa::OpenApi;

use super::handlers::{
    guild::{
        channel::{
            create_channel::__path_create_channel_handler,
            get_channels::__path_get_channels_handler,
            get_messages::__path_get_messages_handler,
        },
        create_guild::__path_create_guild_handler,
        create_role::__path_create_role_handler,
        delete_guild::__path_delete_guild_handler,
        delete_role::__path_delete_role_handler,
        get_role::__path_get_role_handler,
        get_roles::__path_get_roles_handler,
    },
    user::get_user_guilds::__path_get_user_guilds,
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
        get_user_guilds,
    )
)]
pub struct ApiDoc;
