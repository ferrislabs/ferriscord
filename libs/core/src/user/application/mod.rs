use ferriscord_auth::{HasAuthRepository, FerriskeyAuthRepository};
use sqlx::PgPool;

use crate::user::{
    domain::common::{CoreError, Service},
    infrastructure::user::postgres::PostgresUserRepository,
};

pub type UserFerrisCordService = Service<PostgresUserRepository, FerriskeyAuthRepository>;

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
    let user_repository = PostgresUserRepository::new(pool.clone());
    let auth_repository = FerriskeyAuthRepository::new(issuer.into(), None);

    Ok(UserFerrisCordService {
        user_repository,
        auth_repository,
    })
}
