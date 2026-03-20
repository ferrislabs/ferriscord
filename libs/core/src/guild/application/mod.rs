use ferriscord_auth::FerriskeyAuthRepository;
use sqlx::PgPool;

use crate::guild::{
    domain::{
        channel::ChannelServiceImpl,
        errors::CoreError,
        guild::GuildServiceImpl,
        message::MessageServiceImpl,
        role::RoleServiceImpl,
    },
    infrastructure::{
        channel::postgres::PostgresChannelRepository,
        guild::postgres::PostgresGuildRepository,
        member::postgres::PostgresMemberRepository,
        message::postgres::PostgresMessageRepository,
        role::postgres::PostgresRoleRepository,
    },
};

pub type GuildFerrisCordService = GuildServiceImpl<
    PostgresGuildRepository,
    PostgresRoleRepository,
    PostgresMemberRepository,
>;

pub type RoleFerrisCordService = RoleServiceImpl<
    PostgresGuildRepository,
    PostgresRoleRepository,
>;

pub type ChannelFerrisCordService = ChannelServiceImpl<
    PostgresGuildRepository,
    PostgresChannelRepository,
>;

pub type MessageFerrisCordService = MessageServiceImpl<
    PostgresGuildRepository,
    PostgresMessageRepository,
>;

pub fn create_guild_services(
    pool: PgPool,
    _issuer: impl Into<String>,
) -> Result<
    (GuildFerrisCordService, RoleFerrisCordService, ChannelFerrisCordService, MessageFerrisCordService),
    CoreError,
> {
    let guild_repo = PostgresGuildRepository::new(pool.clone());
    let role_repo = PostgresRoleRepository::new(pool.clone());
    let member_repo = PostgresMemberRepository::new(pool.clone());
    let channel_repo = PostgresChannelRepository::new(pool.clone());
    let message_repo = PostgresMessageRepository::new(pool.clone());

    Ok((
        GuildServiceImpl {
            guild_repository: guild_repo.clone(),
            role_repository: role_repo.clone(),
            member_repository: member_repo,
        },
        RoleServiceImpl {
            guild_repository: guild_repo.clone(),
            role_repository: role_repo,
        },
        ChannelServiceImpl {
            guild_repository: guild_repo.clone(),
            channel_repository: channel_repo,
        },
        MessageServiceImpl {
            guild_repository: guild_repo,
            message_repository: message_repo,
        },
    ))
}

pub fn create_auth_repository(issuer: impl Into<String>) -> FerriskeyAuthRepository {
    FerriskeyAuthRepository::new(issuer.into(), None)
}
