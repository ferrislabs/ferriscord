use ferriscord_auth::{FerriskeyAuthRepository, HasAuthRepository};
use sqlx::PgPool;

use crate::guild::{
    domain::{common::Service, errors::CoreError},
    infrastructure::{
        channel::postgres::PostgresChannelRepository,
        guild::postgres::PostgresGuildRepository,
        member::postgres::PostgresMemberRepository,
        message::postgres::PostgresMessageRepository,
        role::postgres::PostgresRoleRepository,
    },
};

pub type GuildFerrisCordService = Service<
    PostgresGuildRepository,
    FerriskeyAuthRepository,
    PostgresRoleRepository,
    PostgresMemberRepository,
    PostgresChannelRepository,
    PostgresMessageRepository,
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
    Ok(GuildFerrisCordService {
        guild_repository: PostgresGuildRepository::new(pool.clone()),
        auth_repository: FerriskeyAuthRepository::new(issuer.into(), None),
        role_repository: PostgresRoleRepository::new(pool.clone()),
        member_repository: PostgresMemberRepository::new(pool.clone()),
        channel_repository: PostgresChannelRepository::new(pool.clone()),
        message_repository: PostgresMessageRepository::new(pool.clone()),
    })
}
