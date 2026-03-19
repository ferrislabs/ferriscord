use std::future::Future;

use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};

use crate::guild::domain::errors::CoreError;

pub trait MessagePort: Send + Sync {
    /// `author_sub` is the JWT `sub` claim (oauth_sub in the users table).
    fn insert(
        &self,
        channel_id: &ChannelId,
        author_sub: &str,
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

    fn send_message(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        content: String,
    ) -> impl Future<Output = Result<Message, CoreError>> + Send;
}
