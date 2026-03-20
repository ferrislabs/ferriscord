use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{guild::GuildId, Id};

// ─── ChannelId ───────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema)]
pub struct ChannelId(pub Id);

impl ChannelId {
    pub fn new() -> Self {
        Self(Id::new())
    }

    pub fn get_uuid(&self) -> Uuid {
        self.0.get_uuid()
    }
}

impl Default for ChannelId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for ChannelId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

// ─── ChannelKind ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum ChannelKind {
    Text = 0,
    Dm = 1,
    Voice = 2,
    Category = 4,
    Announcement = 5,
    Stage = 13,
    Forum = 15,
}

impl From<ChannelKind> for i16 {
    fn from(k: ChannelKind) -> i16 {
        k as i16
    }
}

impl TryFrom<i16> for ChannelKind {
    type Error = &'static str;
    fn try_from(v: i16) -> Result<Self, Self::Error> {
        match v {
            0 => Ok(Self::Text),
            1 => Ok(Self::Dm),
            2 => Ok(Self::Voice),
            4 => Ok(Self::Category),
            5 => Ok(Self::Announcement),
            13 => Ok(Self::Stage),
            15 => Ok(Self::Forum),
            _ => Err("invalid ChannelKind value"),
        }
    }
}

// ─── OverwriteKind ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum OverwriteKind {
    Role = 0,
    Member = 1,
}

impl From<OverwriteKind> for i16 {
    fn from(k: OverwriteKind) -> i16 {
        k as i16
    }
}

impl TryFrom<i16> for OverwriteKind {
    type Error = &'static str;
    fn try_from(v: i16) -> Result<Self, Self::Error> {
        match v {
            0 => Ok(Self::Role),
            1 => Ok(Self::Member),
            _ => Err("invalid OverwriteKind value"),
        }
    }
}

// ─── PermissionOverwrite ─────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct PermissionOverwrite {
    pub id: Uuid,
    pub kind: OverwriteKind,
    pub allow: u64,
    pub deny: u64,
}

// ─── ChannelFlags ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct ChannelFlags(pub u32);

impl ChannelFlags {
    pub const NONE: ChannelFlags = ChannelFlags(0);
    pub const REQUIRE_TAG: ChannelFlags = ChannelFlags(1 << 4);
    pub const HIDE_MEDIA_DOWNLOAD: ChannelFlags = ChannelFlags(1 << 15);

    pub fn contains(self, other: ChannelFlags) -> bool {
        self.0 & other.0 == other.0
    }
}

impl Default for ChannelFlags {
    fn default() -> Self {
        Self::NONE
    }
}

// ─── AutoArchiveDuration ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum AutoArchiveDuration {
    OneHour = 60,
    OneDay = 1440,
    ThreeDays = 4320,
    OneWeek = 10080,
}

impl From<AutoArchiveDuration> for u32 {
    fn from(d: AutoArchiveDuration) -> u32 {
        d as u32
    }
}

impl TryFrom<u32> for AutoArchiveDuration {
    type Error = &'static str;
    fn try_from(v: u32) -> Result<Self, Self::Error> {
        match v {
            60 => Ok(Self::OneHour),
            1440 => Ok(Self::OneDay),
            4320 => Ok(Self::ThreeDays),
            10080 => Ok(Self::OneWeek),
            _ => Err("invalid AutoArchiveDuration value"),
        }
    }
}

// ─── SortOrder ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum SortOrder {
    LatestActivity = 0,
    CreationDate = 1,
}

impl From<SortOrder> for i16 {
    fn from(s: SortOrder) -> i16 {
        s as i16
    }
}

impl TryFrom<i16> for SortOrder {
    type Error = &'static str;
    fn try_from(v: i16) -> Result<Self, Self::Error> {
        match v {
            0 => Ok(Self::LatestActivity),
            1 => Ok(Self::CreationDate),
            _ => Err("invalid SortOrder value"),
        }
    }
}

// ─── ForumLayout ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum ForumLayout {
    NotSet = 0,
    ListView = 1,
    GalleryView = 2,
}

impl From<ForumLayout> for i16 {
    fn from(f: ForumLayout) -> i16 {
        f as i16
    }
}

impl TryFrom<i16> for ForumLayout {
    type Error = &'static str;
    fn try_from(v: i16) -> Result<Self, Self::Error> {
        match v {
            0 => Ok(Self::NotSet),
            1 => Ok(Self::ListView),
            2 => Ok(Self::GalleryView),
            _ => Err("invalid ForumLayout value"),
        }
    }
}

// ─── ForumTag ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct ForumTag {
    pub id: Uuid,
    pub name: String,
    pub moderated: bool,
    pub emoji_id: Option<Uuid>,
    pub emoji_name: Option<String>,
}

// ─── DefaultReaction ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct DefaultReaction {
    pub emoji_id: Option<Uuid>,
    pub emoji_name: Option<String>,
}

// ─── Channel ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub struct Channel {
    pub id: ChannelId,
    pub kind: ChannelKind,
    pub guild_id: Option<GuildId>,
    pub position: i32,
    pub permission_overwrites: Vec<PermissionOverwrite>,
    pub name: String,
    pub topic: Option<String>,
    pub nsfw: bool,
    pub last_message_id: Option<Uuid>,
    pub rate_limit_per_user: u32,
    pub parent_id: Option<ChannelId>,
    pub last_pin_timestamp: Option<DateTime<Utc>>,
    pub bitrate: Option<u32>,
    pub user_limit: Option<u32>,
    pub rtc_region: Option<String>,
    pub default_auto_archive_duration: Option<AutoArchiveDuration>,
    pub flags: ChannelFlags,
    pub available_tags: Vec<ForumTag>,
    pub default_reaction_emoji: Option<DefaultReaction>,
    pub default_thread_rate_limit_per_user: u32,
    pub default_sort_order: Option<SortOrder>,
    pub default_forum_layout: Option<ForumLayout>,
    pub created_at: DateTime<Utc>,
}
