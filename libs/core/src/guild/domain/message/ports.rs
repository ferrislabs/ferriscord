use std::future::Future;

use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
    user::UserId,
};

use crate::guild::domain::errors::CoreError;

pub trait MessagePort: Send + Sync {
    fn insert(
        &self,
        channel_id: &ChannelId,
        author_id: &UserId,
        content: String,
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
}
