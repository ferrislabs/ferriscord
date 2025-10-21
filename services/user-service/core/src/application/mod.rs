use sqlx::PgPool;

use crate::{
    domain::{
        Config,
        common::{CoreError, Service},
    },
    infrastructure::user::postgres::PostgresUserRepository,
};

pub type FerrisCordService = Service<PostgresUserRepository>;

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

    Ok(FerrisCordService { user_repository })
}
