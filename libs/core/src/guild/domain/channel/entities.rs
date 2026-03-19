use ferriscord_entities::channel::{
    AutoArchiveDuration, ChannelFlags, ChannelId, ChannelKind, DefaultReaction, ForumLayout,
    ForumTag, PermissionOverwrite, SortOrder,
};
use ferriscord_entities::guild::GuildId;

pub struct CreateChannelInput {
    pub name: String,
    pub kind: ChannelKind,
    pub guild_id: GuildId,
    pub topic: Option<String>,
    pub position: Option<i32>,
    pub nsfw: Option<bool>,
    pub rate_limit_per_user: Option<u32>,
    pub parent_id: Option<ChannelId>,
    pub bitrate: Option<u32>,
    pub user_limit: Option<u32>,
    pub rtc_region: Option<String>,
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
    pub default_auto_archive_duration: Option<AutoArchiveDuration>,
    pub flags: Option<ChannelFlags>,
    pub available_tags: Option<Vec<ForumTag>>,
    pub default_reaction_emoji: Option<DefaultReaction>,
    pub default_thread_rate_limit_per_user: Option<u32>,
    pub default_sort_order: Option<SortOrder>,
    pub default_forum_layout: Option<ForumLayout>,
}
