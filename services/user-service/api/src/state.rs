use std::sync::Arc;

use ferriscord_error::ApiError;
use user_core::{Config, FerrisCordService, create_service};

use crate::args::Args;

#[derive(Clone)]
pub struct AppState {
    pub args: Arc<Args>,
    pub service: FerrisCordService,
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
