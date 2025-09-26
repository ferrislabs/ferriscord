use sqlx::PgPool;

use crate::{
    domain::{Config, errors::CoreError},
    infrastructure::guild::{GuildRepository, postgres::PostgresGuildRepository},
};

pub struct Repos {
    pub guild_repository: GuildRepository,
}

pub async fn build_repos_from_conf(conf: &Config) -> Result<Repos, CoreError> {
    let database_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        conf.database.user,
        conf.database.password,
        conf.database.host,
        conf.database.port,
        conf.database.dbname
    );

    let pool = PgPool::connect(&database_url).await.map_err(|e| {
        CoreError::InfrastructureDatabaseSetupError {
            details: e.to_string(),
        }
    })?;

    let guild_repository = GuildRepository::Postgres(PostgresGuildRepository::new(pool.clone()));
    Ok(Repos { guild_repository })
}
