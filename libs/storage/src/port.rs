use std::{future::Future, time::Duration};

use bytes::Bytes;

use crate::{ObjectInfo, StorageError};

/// Abstraction over any S3-compatible storage backend.
pub trait StoragePort: Send + Sync + Clone {
    /// Upload an object. Overwrites if the key already exists.
    fn put_object(
        &self,
        bucket: &str,
        key: &str,
        body: Bytes,
        content_type: &str,
    ) -> impl Future<Output = Result<(), StorageError>> + Send;

    /// Download an object's body.
    fn get_object(
        &self,
        bucket: &str,
        key: &str,
    ) -> impl Future<Output = Result<Bytes, StorageError>> + Send;

    /// Delete an object. Succeeds even if the object does not exist.
    fn delete_object(
        &self,
        bucket: &str,
        key: &str,
    ) -> impl Future<Output = Result<(), StorageError>> + Send;

    /// Check whether an object exists.
    fn object_exists(
        &self,
        bucket: &str,
        key: &str,
    ) -> impl Future<Output = Result<bool, StorageError>> + Send;

    /// List objects under a prefix. Pass an empty string for all objects.
    fn list_objects(
        &self,
        bucket: &str,
        prefix: &str,
    ) -> impl Future<Output = Result<Vec<ObjectInfo>, StorageError>> + Send;

    /// Copy an object within or across buckets.
    fn copy_object(
        &self,
        src_bucket: &str,
        src_key: &str,
        dst_bucket: &str,
        dst_key: &str,
    ) -> impl Future<Output = Result<(), StorageError>> + Send;

    /// Generate a pre-signed GET URL valid for `expires_in`.
    fn presigned_get_url(
        &self,
        bucket: &str,
        key: &str,
        expires_in: Duration,
    ) -> impl Future<Output = Result<String, StorageError>> + Send;

    /// Generate a pre-signed PUT URL valid for `expires_in`.
    fn presigned_put_url(
        &self,
        bucket: &str,
        key: &str,
        expires_in: Duration,
    ) -> impl Future<Output = Result<String, StorageError>> + Send;

    /// Create a bucket if it does not already exist.
    fn create_bucket(
        &self,
        bucket: &str,
    ) -> impl Future<Output = Result<(), StorageError>> + Send;

    /// Delete a bucket. The bucket must be empty.
    fn delete_bucket(
        &self,
        bucket: &str,
    ) -> impl Future<Output = Result<(), StorageError>> + Send;
}
