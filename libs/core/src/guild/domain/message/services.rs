use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};
use ferriscord_permission::{Permissions, require_permission};

use crate::guild::domain::{
    channel::ports::ChannelPort,
    common::Service,
    errors::CoreError,
    guild::ports::GuildPort,
    member::ports::MemberRepository,
    role::ports::RoleRepository,
};

use super::ports::{MessagePort, MessageService};

impl<G, A, R, M, C, Msg> MessageService for Service<G, A, R, M, C, Msg>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
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
            self.build_permission_context(&identity, &guild_id).await?;

        require_permission!(permission_context, Permissions::VIEW_CHANNEL);

        self.message_repository
            .list_by_channel(&channel_id, before, limit.min(100))
            .await
    }
}
