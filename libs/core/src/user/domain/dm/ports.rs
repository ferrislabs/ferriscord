use std::future::Future;

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
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;
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
        before: Option<Uuid>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;
}
