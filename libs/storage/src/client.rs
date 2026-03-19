use std::time::Duration;

use aws_config::{BehaviorVersion, Region};
use aws_credential_types::Credentials;
use aws_sdk_s3::{
    Client,
    config::Builder as S3ConfigBuilder,
    error::SdkError,
    operation::{
        copy_object::CopyObjectError, create_bucket::CreateBucketError,
        delete_bucket::DeleteBucketError, delete_object::DeleteObjectError,
        get_object::GetObjectError, head_object::HeadObjectError,
        list_objects_v2::ListObjectsV2Error, put_object::PutObjectError,
    },
    presigning::PresigningConfig,
    primitives::ByteStream,
    types::CreateBucketConfiguration,
};
use bytes::Bytes;
use tracing::{debug, error};

use ferriscord_config::StorageConfig;

use crate::{ObjectInfo, StorageError, port::StoragePort};

/// S3-compatible storage client.
///
/// Works with AWS S3, Garage, RustFS, MinIO, and any other S3-compatible service.
/// Use [`S3Client::new`] to build from a [`StorageConfig`].
#[derive(Clone)]
pub struct S3Client {
    inner: Client,
    config: StorageConfig,
}

impl S3Client {
    pub async fn new(config: StorageConfig) -> Result<Self, StorageError> {
        let credentials = Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "ferriscord-storage",
        );

        let mut s3_config = S3ConfigBuilder::new()
            .behavior_version(BehaviorVersion::latest())
            .credentials_provider(credentials)
            .region(Region::new(config.region.clone()))
            .force_path_style(config.force_path_style);

        if let Some(ref endpoint) = config.endpoint {
            s3_config = s3_config.endpoint_url(endpoint);
        }

        let inner = Client::from_conf(s3_config.build());

        Ok(Self { inner, config })
    }
}

// ─── Error helpers ────────────────────────────────────────────────────────────

fn sdk_err<E: std::fmt::Debug>(key: &str, e: SdkError<E>) -> StorageError {
    error!("S3 error for key '{}': {:?}", key, e);
    StorageError::S3(e.to_string())
}

// ─── StoragePort impl ─────────────────────────────────────────────────────────

impl StoragePort for S3Client {
    async fn put_object(
        &self,
        bucket: &str,
        key: &str,
        body: Bytes,
        content_type: &str,
    ) -> Result<(), StorageError> {
        debug!("put_object bucket={} key={}", bucket, key);

        self.inner
            .put_object()
            .bucket(bucket)
            .key(key)
            .body(ByteStream::from(body))
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| map_put_err(key, e))?;

        Ok(())
    }

    async fn get_object(&self, bucket: &str, key: &str) -> Result<Bytes, StorageError> {
        debug!("get_object bucket={} key={}", bucket, key);

        let resp = self
            .inner
            .get_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| map_get_err(key, e))?;

        let data = resp
            .body
            .collect()
            .await
            .map_err(|e| StorageError::S3(e.to_string()))?
            .into_bytes();

        Ok(data)
    }

    async fn delete_object(&self, bucket: &str, key: &str) -> Result<(), StorageError> {
        debug!("delete_object bucket={} key={}", bucket, key);

        self.inner
            .delete_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| map_delete_err(key, e))?;

        Ok(())
    }

    async fn object_exists(&self, bucket: &str, key: &str) -> Result<bool, StorageError> {
        debug!("object_exists bucket={} key={}", bucket, key);

        match self
            .inner
            .head_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await
        {
            Ok(_) => Ok(true),
            Err(SdkError::ServiceError(e)) if e.err().is_not_found() => Ok(false),
            Err(e) => Err(map_head_err(key, e)),
        }
    }

    async fn list_objects(
        &self,
        bucket: &str,
        prefix: &str,
    ) -> Result<Vec<ObjectInfo>, StorageError> {
        debug!("list_objects bucket={} prefix={}", bucket, prefix);

        let mut objects = Vec::new();
        let mut continuation_token: Option<String> = None;

        loop {
            let mut req = self
                .inner
                .list_objects_v2()
                .bucket(bucket)
                .prefix(prefix);

            if let Some(token) = continuation_token {
                req = req.continuation_token(token);
            }

            let resp = req
                .send()
                .await
                .map_err(|e| map_list_err(bucket, e))?;

            for obj in resp.contents() {
                objects.push(ObjectInfo {
                    key: obj.key().unwrap_or_default().to_string(),
                    size: obj.size(),
                    last_modified: obj.last_modified().and_then(|dt| {
                        chrono::DateTime::from_timestamp(dt.secs(), dt.subsec_nanos())
                    }),
                    etag: obj.e_tag().map(|s| s.trim_matches('"').to_string()),
                });
            }

            match resp.next_continuation_token() {
                Some(token) => continuation_token = Some(token.to_string()),
                None => break,
            }
        }

        Ok(objects)
    }

    async fn copy_object(
        &self,
        src_bucket: &str,
        src_key: &str,
        dst_bucket: &str,
        dst_key: &str,
    ) -> Result<(), StorageError> {
        debug!(
            "copy_object {}/{} -> {}/{}",
            src_bucket, src_key, dst_bucket, dst_key
        );

        let copy_source = format!("{}/{}", src_bucket, src_key);

        self.inner
            .copy_object()
            .bucket(dst_bucket)
            .key(dst_key)
            .copy_source(&copy_source)
            .send()
            .await
            .map_err(|e| map_copy_err(src_key, e))?;

        Ok(())
    }

    async fn presigned_get_url(
        &self,
        bucket: &str,
        key: &str,
        expires_in: Duration,
    ) -> Result<String, StorageError> {
        debug!("presigned_get_url bucket={} key={}", bucket, key);

        let presigning = PresigningConfig::expires_in(expires_in)
            .map_err(|e| StorageError::InvalidConfig { message: e.to_string() })?;

        let url = self
            .inner
            .get_object()
            .bucket(bucket)
            .key(key)
            .presigned(presigning)
            .await
            .map_err(|e| StorageError::S3(e.to_string()))?
            .uri()
            .to_string();

        Ok(url)
    }

    async fn presigned_put_url(
        &self,
        bucket: &str,
        key: &str,
        expires_in: Duration,
    ) -> Result<String, StorageError> {
        debug!("presigned_put_url bucket={} key={}", bucket, key);

        let presigning = PresigningConfig::expires_in(expires_in)
            .map_err(|e| StorageError::InvalidConfig { message: e.to_string() })?;

        let url = self
            .inner
            .put_object()
            .bucket(bucket)
            .key(key)
            .presigned(presigning)
            .await
            .map_err(|e| StorageError::S3(e.to_string()))?
            .uri()
            .to_string();

        Ok(url)
    }

    async fn create_bucket(&self, bucket: &str) -> Result<(), StorageError> {
        debug!("create_bucket bucket={}", bucket);

        let mut req = self.inner.create_bucket().bucket(bucket);

        // AWS requires a LocationConstraint for regions other than us-east-1
        if self.config.region != "us-east-1" && self.config.endpoint.is_none() {
            let constraint = CreateBucketConfiguration::builder()
                .location_constraint(
                    self.config.region.parse().map_err(|_| StorageError::InvalidConfig {
                        message: format!("invalid region: {}", self.config.region),
                    })?,
                )
                .build();
            req = req.create_bucket_configuration(constraint);
        }

        match req.send().await {
            Ok(_) => Ok(()),
            Err(SdkError::ServiceError(e)) if e.err().is_bucket_already_owned_by_you() => Ok(()),
            Err(e) => Err(map_create_bucket_err(bucket, e)),
        }
    }

    async fn delete_bucket(&self, bucket: &str) -> Result<(), StorageError> {
        debug!("delete_bucket bucket={}", bucket);

        self.inner
            .delete_bucket()
            .bucket(bucket)
            .send()
            .await
            .map_err(|e| map_delete_bucket_err(bucket, e))?;

        Ok(())
    }
}

// ─── Error mappers ────────────────────────────────────────────────────────────

fn map_put_err(key: &str, e: SdkError<PutObjectError>) -> StorageError {
    match &e {
        SdkError::ServiceError(se) => match se.err() {
            _ => sdk_err(key, e),
        },
        _ => sdk_err(key, e),
    }
}

fn map_get_err(key: &str, e: SdkError<GetObjectError>) -> StorageError {
    match &e {
        SdkError::ServiceError(se) if se.err().is_no_such_key() => {
            StorageError::NotFound { key: key.to_string() }
        }
        _ => sdk_err(key, e),
    }
}

fn map_delete_err(key: &str, e: SdkError<DeleteObjectError>) -> StorageError {
    sdk_err(key, e)
}

fn map_head_err(key: &str, e: SdkError<HeadObjectError>) -> StorageError {
    sdk_err(key, e)
}

fn map_list_err(bucket: &str, e: SdkError<ListObjectsV2Error>) -> StorageError {
    match &e {
        SdkError::ServiceError(se) if se.err().is_no_such_bucket() => {
            StorageError::BucketNotFound { bucket: bucket.to_string() }
        }
        _ => sdk_err(bucket, e),
    }
}

fn map_copy_err(key: &str, e: SdkError<CopyObjectError>) -> StorageError {
    sdk_err(key, e)
}

fn map_create_bucket_err(bucket: &str, e: SdkError<CreateBucketError>) -> StorageError {
    sdk_err(bucket, e)
}

fn map_delete_bucket_err(bucket: &str, e: SdkError<DeleteBucketError>) -> StorageError {
    sdk_err(bucket, e)
}
