use ferriscord_entities::{friendship::DmChannel, message::Message};
use uuid::Uuid;

use crate::user::domain::{
    common::CoreError,
    dm::ports::{DmAttachmentInput, DmEncryptionMeta, DmRepository, DmService},
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
}
