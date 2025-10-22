use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("invalid token: {message}")]
    InvalidToken { message: String },
}
