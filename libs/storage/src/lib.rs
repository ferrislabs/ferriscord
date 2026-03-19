//! S3-compatible object storage client for ferriscord.
//!
//! Works with AWS S3, Garage, RustFS, MinIO, and any other S3-compatible backend.
//!
//! # Quick start
//!
//! ```rust,no_run
//! use ferriscord_storage::{S3Client, StorageConfig, StoragePort};
//! use bytes::Bytes;
//! use std::time::Duration;
//!
//! #[tokio::main]
//! async fn main() {
//!     // Garage / RustFS / MinIO
//!     let config = StorageConfig::new("garage", "my-access-key", "my-secret-key")
//!         .with_endpoint("http://localhost:3900");
//!
//!     let client = S3Client::new(config).await.unwrap();
//!
//!     // Upload
//!     client
//!         .put_object("my-bucket", "avatars/user-1.png", Bytes::from("..."), "image/png")
//!         .await
//!         .unwrap();
//!
//!     // Pre-signed download URL (valid 1 hour)
//!     let url = client
//!         .presigned_get_url("my-bucket", "avatars/user-1.png", Duration::from_secs(3600))
//!         .await
//!         .unwrap();
//! }
//! ```

mod client;
mod error;
mod port;

pub use client::S3Client;
pub use error::StorageError;
pub use port::StoragePort;
pub use ferriscord_config::StorageConfig;

use chrono::{DateTime, Utc};

/// Metadata for a listed object.
#[derive(Debug, Clone)]
pub struct ObjectInfo {
    /// Full object key.
    pub key: String,
    /// Size in bytes, if available.
    pub size: Option<i64>,
    /// Last modified timestamp, if available.
    pub last_modified: Option<DateTime<Utc>>,
    /// ETag (MD5 or multipart hash), stripped of surrounding quotes.
    pub etag: Option<String>,
}
