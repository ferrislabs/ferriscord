use std::sync::Arc;

use ferriscord_auth::{FerriskeyAuthRepository, HasAuthRepository};
use ferriscord_config::{AuthConfig, DatabaseConfig, StorageConfig};
use ferriscord_core::{
    guild::application::{
        ChannelFerrisCordService, GuildFerrisCordService, MessageFerrisCordService,
        RoleFerrisCordService, create_auth_repository, create_guild_services,
    },
    user::application::{
        DmFerrisCordService, FriendFerrisCordService, UserFerrisCordService, create_user_services,
    },
};
use ferriscord_error::ApiError;
use ferriscord_storage::S3Client;
use sqlx::PgPool;

use crate::args::Args;

#[derive(Clone)]
pub struct AppState {
    pub args: Arc<Args>,
    pub auth: FerriskeyAuthRepository,
    // User domain
    pub user_service: UserFerrisCordService,
    pub friend_service: FriendFerrisCordService,
    pub dm_service: DmFerrisCordService,
    // Guild domain
    pub guild_service: GuildFerrisCordService,
    pub role_service: RoleFerrisCordService,
    pub channel_service: ChannelFerrisCordService,
    pub message_service: MessageFerrisCordService,
    pub storage: S3Client,
}

impl HasAuthRepository for AppState {
    type AuthRepo = FerriskeyAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        &self.auth
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

    let pool = PgPool::connect(&database_url).await.map_err(|e| ApiError::Unknown {
        message: e.to_string(),
    })?;

    let auth = create_auth_repository(auth_config.issuer.clone());

    let (user_service, friend_service, dm_service) =
        create_user_services(pool.clone(), auth_config.issuer.clone())
            .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let (guild_service, role_service, channel_service, message_service) =
        create_guild_services(pool.clone(), auth_config.issuer.clone())
            .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let storage = S3Client::new(storage_config).await.map_err(|e| ApiError::Unknown {
        message: e.to_string(),
    })?;

    Ok(AppState {
        args,
        auth,
        user_service,
        friend_service,
        dm_service,
        guild_service,
        role_service,
        channel_service,
        message_service,
        storage,
    })
}
