use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};
use ferriscord_permission::{Permissions, require_permission};

use crate::guild::domain::{
    common::build_permission_context,
    errors::CoreError,
    guild::ports::GuildPort,
};

use super::ports::{AttachmentInput, MessagePort, MessageService};

#[derive(Clone)]
pub struct MessageServiceImpl<G, Msg>
where
    G: GuildPort,
    Msg: MessagePort,
{
    pub(crate) guild_repository: G,
    pub(crate) message_repository: Msg,
}

impl<G, Msg> MessageService for MessageServiceImpl<G, Msg>
where
    G: GuildPort,
    Msg: MessagePort,
{
    async fn get_channel_messages(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        before: Option<MessageId>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        let mut permission_context =
            build_permission_context(&self.guild_repository, &identity, &guild_id).await?;

        require_permission!(permission_context, Permissions::VIEW_CHANNEL);

        self.message_repository.list_by_channel(&channel_id, before, limit.min(100)).await
    }

    async fn send_message(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        content: String,
        attachments: Vec<AttachmentInput>,
    ) -> Result<Message, CoreError> {
        let mut permission_context =
            build_permission_context(&self.guild_repository, &identity, &guild_id).await?;

        require_permission!(permission_context, Permissions::SEND_MESSAGES);

        self.message_repository
            .insert(&channel_id, identity.id(), content, attachments)
            .await
    }
}
