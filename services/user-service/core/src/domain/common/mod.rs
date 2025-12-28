use ferriscord_auth::AuthRepository;
use thiserror::Error;

use crate::domain::user::ports::UserRepository;

#[derive(Clone)]
pub struct Service<U, A>
where
    U: UserRepository,
    A: AuthRepository,
{
    pub(crate) user_repository: U,
    pub(crate) auth_repository: A,
}

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("internal server error: {message}")]
    InternalServerError { message: String },

    #[error("infrastructure database setup error: {details}")]
    InfrastructureDatabaseSetupError { details: String },
}
