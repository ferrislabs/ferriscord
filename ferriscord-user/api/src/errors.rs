use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("unknown error: {message}")]
    Unknown { message: String },
}
