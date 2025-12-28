use utoipa::OpenApi;

use super::handlers::{
    create_guild::__path_create_guild_handler, create_role::__path_create_role_handler,
    delete_guild::__path_delete_guild_handler, delete_role::__path_delete_role_handler,
    get_role::__path_get_role_handler, get_roles::__path_get_roles_handler,
};

#[derive(OpenApi)]
#[openapi(
    info(title = "FerrisCord - Guild Service"),
    paths(
        create_guild_handler,
        create_role_handler,
        delete_guild_handler,
        delete_role_handler,
        get_role_handler,
        get_roles_handler,
    )
)]
pub struct ApiDoc;
