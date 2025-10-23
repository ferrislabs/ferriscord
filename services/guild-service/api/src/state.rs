use std::sync::Arc;

use ferriscord_auth::{HasAuthRepository, KeycloakAuthRepository};
use ferriscord_error::ApiError;
use guild_core::{
    application::{FerrisCordService, create_service},
    domain::Config,
};

use crate::args::Args;

#[derive(Clone)]
pub struct AppState {
    #[allow(unused)]
    pub args: Arc<Args>,
    #[allow(unused)]
    pub service: FerrisCordService,
}

impl HasAuthRepository for AppState {
    type AuthRepo = KeycloakAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        &self.service.auth_repository
    }
}

pub async fn state(args: Arc<Args>) -> Result<AppState, ApiError> {
    let config: Config = Config::from(args.as_ref().clone());

    let service = create_service(config)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(AppState { args, service })
}
