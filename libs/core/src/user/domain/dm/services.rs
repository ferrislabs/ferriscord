use ferriscord_entities::{friendship::DmChannel, message::Message};
use uuid::Uuid;

use crate::user::domain::{
    common::CoreError,
    dm::ports::{
        DmAttachmentInput, DmEncryptionMeta, DmHistorySyncJob, DmHistorySyncPayloadInput,
        DmRepository, DmService,
    },
};

#[derive(Clone)]
pub struct DmServiceImpl<D: DmRepository> {
    pub(crate) dm_repository: D,
}

impl<D: DmRepository> DmService for DmServiceImpl<D> {
    async fn create_or_get(
        &self,
        caller_sub: &str,
        recipient_id: Uuid,
    ) -> Result<DmChannel, CoreError> {
        self.dm_repository.create_or_get(caller_sub, recipient_id).await
    }

    async fn list(&self, caller_sub: &str) -> Result<Vec<DmChannel>, CoreError> {
        self.dm_repository.list(caller_sub).await
    }

    async fn get_messages(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        device_id: Option<Uuid>,
        before: Option<Uuid>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        self.dm_repository.get_messages(caller_sub, channel_id, device_id, before, limit).await
    }

    async fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
        encryption: DmEncryptionMeta,
    ) -> Result<Message, CoreError> {
        self.dm_repository.send_message(caller_sub, channel_id, content, attachments, encryption).await
    }

    async fn delete_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        message_id: Uuid,
    ) -> Result<bool, CoreError> {
        self.dm_repository.delete_message(caller_sub, channel_id, message_id).await
    }

    async fn create_history_sync_job(
        &self,
        caller_sub: &str,
        source_device_id: Uuid,
        target_device_id: Uuid,
        channel_id: Option<Uuid>,
    ) -> Result<DmHistorySyncJob, CoreError> {
        self.dm_repository
            .create_history_sync_job(caller_sub, source_device_id, target_device_id, channel_id)
            .await
    }

    async fn get_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> Result<DmHistorySyncJob, CoreError> {
        self.dm_repository.get_history_sync_job(caller_sub, job_id).await
    }

    async fn list_history_sync_messages(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        before: Option<Uuid>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        self.dm_repository
            .list_history_sync_messages(caller_sub, job_id, before, limit)
            .await
    }

    async fn upload_history_sync_payloads(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        payloads: Vec<DmHistorySyncPayloadInput>,
    ) -> Result<u32, CoreError> {
        self.dm_repository
            .upload_history_sync_payloads(caller_sub, job_id, payloads)
            .await
    }

    async fn complete_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
    ) -> Result<DmHistorySyncJob, CoreError> {
        self.dm_repository.complete_history_sync_job(caller_sub, job_id).await
    }

    async fn fail_history_sync_job(
        &self,
        caller_sub: &str,
        job_id: Uuid,
        error_message: String,
    ) -> Result<DmHistorySyncJob, CoreError> {
        self.dm_repository
            .fail_history_sync_job(caller_sub, job_id, error_message)
            .await
    }
}
