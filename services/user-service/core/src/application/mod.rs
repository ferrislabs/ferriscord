use ferriscord_auth::{HasAuthRepository, KeycloakAuthRepository};
use sqlx::PgPool;

use crate::{
    domain::{
        Config,
        common::{CoreError, Service},
    },
    infrastructure::user::postgres::PostgresUserRepository,
};

pub type FerrisCordService = Service<PostgresUserRepository, KeycloakAuthRepository>;

impl HasAuthRepository for FerrisCordService {
    type AuthRepo = KeycloakAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        &self.auth_repository
    }
}

pub async fn create_service(config: Config) -> Result<FerrisCordService, CoreError> {
    let database_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.database.user,
        config.database.password,
        config.database.host,
        config.database.port,
        config.database.dbname
    );

    let pool = PgPool::connect(&database_url).await.map_err(|e| {
        CoreError::InfrastructureDatabaseSetupError {
            details: e.to_string(),
        }
    })?;

    let user_repository = PostgresUserRepository::new(pool.clone());

    let auth_repository = KeycloakAuthRepository::new(config.auth.issuer, None);

    Ok(FerrisCordService {
        user_repository,
        auth_repository,
    })
}
