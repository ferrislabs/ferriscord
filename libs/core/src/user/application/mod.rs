use ferriscord_auth::FerriskeyAuthRepository;
use sqlx::PgPool;

use crate::user::{
    domain::{
        common::CoreError,
        dm::DmServiceImpl,
        friend::FriendServiceImpl,
        user::UserServiceImpl,
    },
    infrastructure::{
        dm::postgres::PostgresDmRepository,
        friend::postgres::PostgresFriendRepository,
        user::postgres::PostgresUserRepository,
    },
};

pub type UserFerrisCordService = UserServiceImpl<PostgresUserRepository>;
pub type FriendFerrisCordService = FriendServiceImpl<PostgresFriendRepository>;
pub type DmFerrisCordService = DmServiceImpl<PostgresDmRepository>;

pub fn create_user_services(
    pool: PgPool,
    _issuer: impl Into<String>,
) -> Result<(UserFerrisCordService, FriendFerrisCordService, DmFerrisCordService), CoreError> {
    Ok((
        UserServiceImpl { user_repository: PostgresUserRepository::new(pool.clone()) },
        FriendServiceImpl { friend_repository: PostgresFriendRepository::new(pool.clone()) },
        DmServiceImpl { dm_repository: PostgresDmRepository::new(pool.clone()) },
    ))
}

pub fn create_auth_repository(issuer: impl Into<String>) -> FerriskeyAuthRepository {
    FerriskeyAuthRepository::new(issuer.into(), None)
}
