use ferriscord_auth::{HasAuthRepository, FerriskeyAuthRepository};
use sqlx::PgPool;

use crate::guild::{
    domain::{common::Service, errors::CoreError},
    infrastructure::{
        guild::postgres::PostgresGuildRepository,
        member::postgres::PostgresMemberRepository,
        role::postgres::PostgresRoleRepository,
    },
};

pub type GuildFerrisCordService = Service<
    PostgresGuildRepository,
    FerriskeyAuthRepository,
    PostgresRoleRepository,
    PostgresMemberRepository,
>;

impl HasAuthRepository for GuildFerrisCordService {
    type AuthRepo = FerriskeyAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        &self.auth_repository
    }
}

pub async fn create_guild_service(
    pool: PgPool,
    issuer: impl Into<String>,
) -> Result<GuildFerrisCordService, CoreError> {
    let guild_repository = PostgresGuildRepository::new(pool.clone());
    let auth_repository = FerriskeyAuthRepository::new(issuer.into(), None);
    let role_repository = PostgresRoleRepository::new(pool.clone());
    let member_repository = PostgresMemberRepository::new(pool.clone());

    Ok(GuildFerrisCordService {
        guild_repository,
        auth_repository,
        role_repository,
        member_repository,
    })
}
