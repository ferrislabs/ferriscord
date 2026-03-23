use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::{Channel, ChannelId},
    guild::GuildId,
};

use crate::guild::domain::errors::CoreError;

use super::entities::{CreateChannelInput, UpdateChannelInput};

pub trait ChannelPort: Send + Sync {
    fn insert(
        &self,
        input: CreateChannelInput,
        position: i32,
    ) -> impl Future<Output = Result<Channel, CoreError>> + Send;

    fn find_by_id(
        &self,
        channel_id: &ChannelId,
    ) -> impl Future<Output = Result<Option<Channel>, CoreError>> + Send;

    fn list_by_guild(
        &self,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Vec<Channel>, CoreError>> + Send;

    fn update_channel(
        &self,
        channel_id: &ChannelId,
        input: UpdateChannelInput,
    ) -> impl Future<Output = Result<Channel, CoreError>> + Send;
}

pub trait ChannelService: Send + Sync {
    fn create_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        input: CreateChannelInput,
    ) -> impl Future<Output = Result<Channel, CoreError>> + Send;

    fn get_guild_channels(
        &self,
        identity: Identity,
        guild_id: GuildId,
    ) -> impl Future<Output = Result<Vec<Channel>, CoreError>> + Send;

    fn update_channel(
        &self,
        identity: Identity,
        guild_id: GuildId,
        channel_id: ChannelId,
        input: UpdateChannelInput,
    ) -> impl Future<Output = Result<Channel, CoreError>> + Send;
}
