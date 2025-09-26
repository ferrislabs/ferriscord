use std::fmt::Display;

use chrono::{DateTime, Utc};

use crate::domain::{Id, guild::entities::GuildId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoleId(pub Id);

impl Display for RoleId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone)]
pub struct Role {
    pub id: RoleId,
    pub guild_id: GuildId,
    pub name: String,
    pub position: i32,
    pub color: u32,
    pub permissions: u64,
    pub created_at: DateTime<Utc>,
}
