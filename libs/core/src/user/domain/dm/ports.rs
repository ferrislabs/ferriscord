use std::future::Future;

use chrono::{DateTime, Utc};
use ferriscord_entities::{
    attachment::AttachmentId,
    friendship::DmChannel,
    message::Message,
};
use uuid::Uuid;

use crate::user::domain::common::CoreError;

pub struct DmAttachmentInput {
    pub id: AttachmentId,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub storage_key: String,
}

#[derive(Debug, Clone)]
pub struct DmDevicePayload {
    pub target_device_id: Uuid,
    pub ciphertext: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DmHistorySyncStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

#[derive(Debug, Clone)]
pub struct DmHistorySyncJob {
    pub id: Uuid,
    pub owner_user_id: Uuid,
    pub source_device_id: Uuid,
    pub target_device_id: Uuid,
    pub channel_id: Option<Uuid>,
    pub status: DmHistorySyncStatus,
    pub cursor_message_id: Option<Uuid>,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct DmHistorySyncPayloadInput {
    pub message_id: Uuid,
    pub ciphertext: String,
}

/// E2EE encryption metadata attached to a DM message.
#[derive(Debug, Clone, Default)]
pub struct DmEncryptionMeta {
    pub encrypted: bool,
    pub encryption_version: i32,
    pub sender_device_id: Option<Uuid>,
    pub device_payloads: Vec<DmDevicePayload>,
}

pub trait DmRepository: Send + Sync {
    fn create_or_get(
        &self,
        caller_sub: &str,
        recipient_id: Uuid,
    ) -> impl Future<Output = Result<DmChannel, CoreError>> + Send;

    fn list(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<DmChannel>, CoreError>> + Send;

    fn get_messages(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        device_id: Option<Uuid>,
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
        encryption: DmEncryptionMeta,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;

    fn delete_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        message_id: Uuid,
    ) -> impl Future<Output = Result<bool, CoreError>> + Send;

    fn create_history_sync_job(
        &self,
        caller_sub: &str,
        source_device_id: Uuid,
        target_device_id: Uuid,
        channel_id: Option<Uuid>,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn get_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn list_history_sync_messages(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn upload_history_sync_payloads(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        payloads: Vec<DmHistorySyncPayloadInput>,
    ) -> impl Future<Output = Result<u32, CoreError>> + Send;

    fn complete_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn fail_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        error_message: String,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;
}

pub trait DmService: Send + Sync {
    fn create_or_get(
        &self,
        caller_sub: &str,
        recipient_id: Uuid,
    ) -> impl Future<Output = Result<DmChannel, CoreError>> + Send;

    fn list(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<DmChannel>, CoreError>> + Send;

    fn get_messages(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        device_id: Option<Uuid>,
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
        encryption: DmEncryptionMeta,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;

    fn delete_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        message_id: Uuid,
    ) -> impl Future<Output = Result<bool, CoreError>> + Send;

    fn create_history_sync_job(
        &self,
        caller_sub: &str,
        source_device_id: Uuid,
        target_device_id: Uuid,
        channel_id: Option<Uuid>,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn get_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn list_history_sync_messages(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn upload_history_sync_payloads(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        payloads: Vec<DmHistorySyncPayloadInput>,
    ) -> impl Future<Output = Result<u32, CoreError>> + Send;

    fn complete_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;

    fn fail_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        error_message: String,
    ) -> impl Future<Output = Result<DmHistorySyncJob, CoreError>> + Send;
}
