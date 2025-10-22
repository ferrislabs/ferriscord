use ferriscord_auth::KeycloakAuthRepository;
use sqlx::PgPool;

use crate::{
    domain::{Config, common::Service, errors::CoreError},
    infrastructure::guild::postgres::PostgresGuildRepository,
};

pub type FerrisCordService = Service<PostgresGuildRepository, KeycloakAuthRepository>;

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

    let guild_repository = PostgresGuildRepository::new(pool.clone());

    let auth_repository = KeycloakAuthRepository::new("issuer", None);

    Ok(FerrisCordService {
        guild_repository,
        auth_repository,
    })
}
