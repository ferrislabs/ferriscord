use std::sync::Arc;

use ferriscord_auth::{HasAuthRepository, FerriskeyAuthRepository};
use ferriscord_config::{AuthConfig, DatabaseConfig, StorageConfig};
use ferriscord_core::{
    guild::application::{GuildFerrisCordService, create_guild_service},
    user::application::{UserFerrisCordService, create_user_service},
};
use ferriscord_error::ApiError;
use ferriscord_storage::S3Client;
use sqlx::PgPool;

use crate::args::Args;

#[derive(Clone)]
pub struct AppState {
    pub args: Arc<Args>,
    pub guild_service: GuildFerrisCordService,
    pub user_service: UserFerrisCordService,
    pub storage: S3Client,
}

impl HasAuthRepository for AppState {
    type AuthRepo = FerriskeyAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        self.guild_service.auth_repository()
    }
}

pub async fn state(args: Arc<Args>) -> Result<AppState, ApiError> {
    let db_config: DatabaseConfig = args.db.clone().into();
    let auth_config: AuthConfig = args.auth.clone().into();
    let storage_config: StorageConfig = args.storage.clone().into();

    let database_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        db_config.user, db_config.password, db_config.host, db_config.port, db_config.dbname
    );

    let pool = PgPool::connect(&database_url)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    let guild_service = create_guild_service(pool.clone(), auth_config.issuer.clone())
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    let user_service = create_user_service(pool.clone(), auth_config.issuer.clone())
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    let storage = S3Client::new(storage_config)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(AppState {
        args,
        guild_service,
        user_service,
        storage,
    })
}
