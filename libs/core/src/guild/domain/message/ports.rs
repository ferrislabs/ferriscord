use std::future::Future;

use ferriscord_auth::Identity;
use ferriscord_entities::{
    attachment::AttachmentId,
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};

use crate::guild::domain::errors::CoreError;

/// Data needed to persist one attachment (files already uploaded to S3 by the handler).
pub struct AttachmentInput {
    pub id: AttachmentId,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub storage_key: String,
}

pub trait MessagePort: Send + Sync {
    /// `author_sub` is the JWT `sub` claim (oauth_sub in the users table).
    fn insert(
        &self,
        channel_id: &ChannelId,
        author_sub: &str,
        content: String,
        attachments: Vec<AttachmentInput>,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;

    fn list_by_channel(
        &self,
        channel_id: &ChannelId,
        before: Option<MessageId>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;
}

pub trait MessageService: Send + Sync {
    fn get_channel_messages(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        before: Option<MessageId>,
        limit: u32,
    ) -> impl Future<Output = Result<Vec<Message>, CoreError>> + Send;

    fn send_message(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        content: String,
        attachments: Vec<AttachmentInput>,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;
}
