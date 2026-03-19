use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_entities::{
    channel::{Channel, ChannelKind},
    guild::GuildId,
};
use ferriscord_permission::{Permissions, require_permission};

use crate::guild::domain::{
    common::Service,
    errors::CoreError,
    guild::ports::GuildPort,
    member::ports::MemberRepository,
    role::ports::RoleRepository,
};

use super::{
    entities::CreateChannelInput,
    ports::{ChannelPort, ChannelService},
};

impl<G, A, R, M, C> ChannelService for Service<G, A, R, M, C>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
{
    async fn create_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        input: CreateChannelInput,
    ) -> Result<Channel, CoreError> {
        let mut permission_context =
            self.build_permission_context(&identity, &guild_id).await?;

        require_permission!(permission_context, Permissions::MANAGE_CHANNELS);

        // Validate parent_id: must reference a Category in the same guild
        if let Some(ref parent_id) = input.parent_id {
            let parent = self
                .channel_repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| CoreError::ChannelNotFound {
                    channel_id: parent_id.clone(),
                })?;

            if parent.kind != ChannelKind::Category {
                return Err(CoreError::InvalidChannelParent);
            }

            if parent.guild_id != guild_id {
                return Err(CoreError::InvalidChannelParent);
            }
        }

        // Compute position if not provided
        let position = match input.position {
            Some(p) => p,
            None => {
                let channels = self.channel_repository.list_by_guild(&guild_id).await?;
                channels
                    .iter()
                    .map(|c| c.position)
                    .max()
                    .map(|m| m + 1)
                    .unwrap_or(0)
            }
        };

        self.channel_repository.insert(input, position).await
    }

    async fn get_guild_channels(
        &self,
        _identity: Identity,
        guild_id: GuildId,
    ) -> Result<Vec<Channel>, CoreError> {
        // Verify the guild exists
        self.guild_repository
            .find_by_id(&guild_id)
            .await?
            .ok_or_else(|| CoreError::GuildNotFound {
                guild_id: guild_id.clone(),
            })?;

        self.channel_repository.list_by_guild(&guild_id).await
    }
}
