use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::{Channel, ChannelId, ChannelKind},
    guild::GuildId,
};
use ferriscord_permission::{Permissions, require_permission};

use crate::guild::domain::{
    common::{build_channel_permission_context, build_permission_context},
    errors::CoreError,
    guild::ports::GuildPort,
    member::ports::MemberRepository,
    role::ports::RoleRepository,
};

use super::{
    entities::{CreateChannelInput, UpdateChannelInput},
    ports::{ChannelPort, ChannelService},
};

#[derive(Clone)]
pub struct ChannelServiceImpl<G, C, R, M>
where
    G: GuildPort,
    C: ChannelPort,
    R: RoleRepository,
    M: MemberRepository,
{
    pub(crate) guild_repository: G,
    pub(crate) channel_repository: C,
    pub(crate) role_repository: R,
    pub(crate) member_repository: M,
}

impl<G, C, R, M> ChannelService for ChannelServiceImpl<G, C, R, M>
where
    G: GuildPort,
    C: ChannelPort,
    R: RoleRepository,
    M: MemberRepository,
{
    async fn create_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        input: CreateChannelInput,
    ) -> Result<Channel, CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_CHANNELS);

        if let Some(ref parent_id) = input.parent_id {
            let parent = self
                .channel_repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| CoreError::ChannelNotFound {
                    channel_id: parent_id.clone(),
                })?;

            let valid_parent = match parent.kind {
                ChannelKind::Category => true,
                ChannelKind::Text => input.kind == ChannelKind::Text,
                _ => false,
            };

            if !valid_parent {
                return Err(CoreError::InvalidChannelParent);
            }

            if parent.guild_id.as_ref() != Some(&guild_id) {
                return Err(CoreError::InvalidChannelParent);
            }
        }

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
        identity: Identity,
        guild_id: GuildId,
    ) -> Result<Vec<Channel>, CoreError> {
        self.guild_repository
            .find_by_id(&guild_id)
            .await?
            .ok_or_else(|| CoreError::GuildNotFound {
                guild_id: guild_id.clone(),
            })?;

        let channels = self.channel_repository.list_by_guild(&guild_id).await?;
        let mut visible = Vec::new();

        for channel in channels {
            let mut permission_context = build_channel_permission_context(
                &self.guild_repository,
                &self.member_repository,
                &self.role_repository,
                &self.channel_repository,
                &identity,
                &guild_id,
                &channel.id,
            )
            .await?;

            if permission_context.can(Permissions::VIEW_CHANNEL) {
                visible.push(channel);
            }
        }

        Ok(visible)
    }

    async fn update_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        input: UpdateChannelInput,
    ) -> Result<Channel, CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_CHANNELS);

        // Validate channel belongs to the guild
        let channel = self
            .channel_repository
            .find_by_id(&channel_id)
            .await?
            .ok_or_else(|| CoreError::ChannelNotFound {
                channel_id: channel_id.clone(),
            })?;

        if channel.guild_id.as_ref() != Some(&guild_id) {
            return Err(CoreError::ChannelNotFound {
                channel_id: channel_id.clone(),
            });
        }

        // Validate parent if provided
        if let Some(ref parent_id) = input.parent_id {
            let parent = self
                .channel_repository
                .find_by_id(parent_id)
                .await?
                .ok_or_else(|| CoreError::ChannelNotFound {
                    channel_id: parent_id.clone(),
                })?;

            let valid_parent = match parent.kind {
                ChannelKind::Category => true,
                ChannelKind::Text => channel.kind == ChannelKind::Text,
                _ => false,
            };

            if !valid_parent {
                return Err(CoreError::InvalidChannelParent);
            }

            if parent.guild_id.as_ref() != Some(&guild_id) {
                return Err(CoreError::InvalidChannelParent);
            }
        }

        self.channel_repository
            .update_channel(&channel_id, input)
            .await
    }

    async fn delete_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
    ) -> Result<(), CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_CHANNELS);

        let channel = self
            .channel_repository
            .find_by_id(&channel_id)
            .await?
            .ok_or_else(|| CoreError::ChannelNotFound {
                channel_id: channel_id.clone(),
            })?;

        if channel.guild_id.as_ref() != Some(&guild_id) {
            return Err(CoreError::ChannelNotFound { channel_id });
        }

        self.channel_repository.delete_channel(&channel.id).await
    }
}
