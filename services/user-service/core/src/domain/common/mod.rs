use thiserror::Error;

use crate::domain::user::ports::UserRepository;

#[derive(Clone)]
pub struct Service<U>
where
    U: UserRepository,
{
    pub(crate) user_repository: U,
}

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("internal server error: {message}")]
    InternalServerError { message: String },

    #[error("infrastructure database setup error: {details}")]
    InfrastructureDatabaseSetupError { details: String },
}
