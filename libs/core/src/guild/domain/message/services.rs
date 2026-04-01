use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};
use ferriscord_permission::{Permissions, require_permission};
use uuid::Uuid;

use crate::guild::domain::{
    channel::ports::ChannelPort, common::build_channel_permission_context, errors::CoreError,
    guild::ports::GuildPort, member::ports::MemberRepository, role::ports::RoleRepository,
};

use super::ports::{AttachmentInput, EncryptionMeta, MessagePort, MessageService};

#[derive(Clone)]
pub struct MessageServiceImpl<G, Msg, R, M, C>
where
    G: GuildPort,
    Msg: MessagePort,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
{
    pub(crate) guild_repository: G,
    pub(crate) message_repository: Msg,
    pub(crate) role_repository: R,
    pub(crate) member_repository: M,
    pub(crate) channel_repository: C,
}

impl<G, Msg, R, M, C> MessageService for MessageServiceImpl<G, Msg, R, M, C>
where
    G: GuildPort,
    Msg: MessagePort,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
{
    async fn get_channel_messages(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        before: Option<MessageId>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        let mut permission_context = build_channel_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &self.channel_repository,
            &identity,
            &guild_id,
            &channel_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::VIEW_CHANNEL);

        self.message_repository
            .list_by_channel(&channel_id, before, limit.min(100))
            .await
    }

    async fn send_message(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        content: String,
        attachments: Vec<AttachmentInput>,
        encryption: EncryptionMeta,
    ) -> Result<Message, CoreError> {
        let mut permission_context = build_channel_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &self.channel_repository,
            &identity,
            &guild_id,
            &channel_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::SEND_MESSAGES);

        self.message_repository
            .insert(&channel_id, identity.id(), content, attachments, encryption)
            .await
    }

    async fn delete_message(
        &self,
        identity: Identity,
        guild_id: GuildId,
        _channel_id: ChannelId,
        message_id: Uuid,
    ) -> Result<(), CoreError> {
        let mut permission_context = build_channel_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &self.channel_repository,
            &identity,
            &guild_id,
            &_channel_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::VIEW_CHANNEL);

        let deleted = self
            .message_repository
            .delete(message_id, identity.id())
            .await?;
        if !deleted {
            return Err(CoreError::InsufficientPermissions);
        }
        Ok(())
    }
}
