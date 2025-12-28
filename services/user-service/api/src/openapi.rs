use utoipa::OpenApi;

use super::handlers::get_user_guilds::__path_get_user_guilds;

#[derive(OpenApi)]
#[openapi(info(title = "Ferriscord - User Service"), paths(get_user_guilds))]
pub struct ApiDoc;
