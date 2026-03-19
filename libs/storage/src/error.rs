use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("object not found: {key}")]
    NotFound { key: String },

    #[error("bucket not found: {bucket}")]
    BucketNotFound { bucket: String },

    #[error("access denied: {message}")]
    AccessDenied { message: String },

    #[error("invalid configuration: {message}")]
    InvalidConfig { message: String },

    #[error("S3 error: {0}")]
    S3(String),

    #[error("serialization error: {message}")]
    Serialization { message: String },
}
