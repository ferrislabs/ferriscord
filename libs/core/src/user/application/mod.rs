use ferriscord_auth::{HasAuthRepository, FerriskeyAuthRepository};
use sqlx::PgPool;

use crate::user::{
    domain::common::{CoreError, Service},
    infrastructure::{
        dm::postgres::PostgresDmRepository,
        friend::postgres::PostgresFriendRepository,
        user::postgres::PostgresUserRepository,
    },
};

pub type UserFerrisCordService = Service<
    PostgresUserRepository,
    FerriskeyAuthRepository,
    PostgresFriendRepository,
    PostgresDmRepository,
>;

impl HasAuthRepository for UserFerrisCordService {
    type AuthRepo = FerriskeyAuthRepository;

    fn auth_repository(&self) -> &Self::AuthRepo {
        &self.auth_repository
    }
}

pub async fn create_user_service(
    pool: PgPool,
    issuer: impl Into<String>,
) -> Result<UserFerrisCordService, CoreError> {
    Ok(UserFerrisCordService {
        user_repository: PostgresUserRepository::new(pool.clone()),
        auth_repository: FerriskeyAuthRepository::new(issuer.into(), None),
        friend_repository: PostgresFriendRepository::new(pool.clone()),
        dm_repository: PostgresDmRepository::new(pool.clone()),
    })
}
