use ferriscord_auth::FerriskeyAuthRepository;
use sqlx::PgPool;

use crate::guild::{
    domain::{
        channel::ChannelServiceImpl, errors::CoreError, guild::GuildServiceImpl,
        invite::InviteServiceImpl, message::MessageServiceImpl, role::RoleServiceImpl,
    },
    infrastructure::{
        channel::postgres::PostgresChannelRepository, guild::postgres::PostgresGuildRepository,
        invite::postgres::PostgresInviteRepository, member::postgres::PostgresMemberRepository,
        message::postgres::PostgresMessageRepository, role::postgres::PostgresRoleRepository,
    },
};

pub type GuildFerrisCordService =
    GuildServiceImpl<PostgresGuildRepository, PostgresRoleRepository, PostgresMemberRepository>;

pub type RoleFerrisCordService =
    RoleServiceImpl<PostgresGuildRepository, PostgresRoleRepository, PostgresMemberRepository>;

pub type ChannelFerrisCordService = ChannelServiceImpl<
    PostgresGuildRepository,
    PostgresChannelRepository,
    PostgresRoleRepository,
    PostgresMemberRepository,
>;

pub type MessageFerrisCordService = MessageServiceImpl<
    PostgresGuildRepository,
    PostgresMessageRepository,
    PostgresRoleRepository,
    PostgresMemberRepository,
    PostgresChannelRepository,
>;

pub type InviteFerrisCordService =
    InviteServiceImpl<PostgresInviteRepository, PostgresGuildRepository, PostgresMemberRepository>;

pub type MemberFerrisCordRepository = PostgresMemberRepository;

pub fn create_guild_services(
    pool: PgPool,
    _issuer: impl Into<String>,
) -> Result<
    (
        GuildFerrisCordService,
        RoleFerrisCordService,
        ChannelFerrisCordService,
        MessageFerrisCordService,
        InviteFerrisCordService,
    ),
    CoreError,
> {
    let guild_repo = PostgresGuildRepository::new(pool.clone());
    let role_repo = PostgresRoleRepository::new(pool.clone());
    let member_repo = PostgresMemberRepository::new(pool.clone());
    let channel_repo = PostgresChannelRepository::new(pool.clone());
    let message_repo = PostgresMessageRepository::new(pool.clone());
    let invite_repo = PostgresInviteRepository::new(pool.clone());

    Ok((
        GuildServiceImpl {
            guild_repository: guild_repo.clone(),
            role_repository: role_repo.clone(),
            member_repository: member_repo.clone(),
        },
        RoleServiceImpl {
            guild_repository: guild_repo.clone(),
            role_repository: role_repo.clone(),
            member_repository: member_repo.clone(),
        },
        ChannelServiceImpl {
            guild_repository: guild_repo.clone(),
            channel_repository: channel_repo.clone(),
            role_repository: role_repo.clone(),
            member_repository: member_repo.clone(),
        },
        MessageServiceImpl {
            guild_repository: guild_repo.clone(),
            message_repository: message_repo,
            role_repository: role_repo.clone(),
            member_repository: member_repo.clone(),
            channel_repository: channel_repo.clone(),
        },
        InviteServiceImpl {
            invite_repository: invite_repo,
            guild_repository: guild_repo,
            member_repository: member_repo,
        },
    ))
}

pub fn create_auth_repository(issuer: impl Into<String>) -> FerriskeyAuthRepository {
    FerriskeyAuthRepository::new(issuer.into(), None)
}
