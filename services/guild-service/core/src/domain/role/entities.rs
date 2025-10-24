use std::fmt::Display;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::{Id, guild::entities::GuildId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RoleId(pub Id);

impl Display for RoleId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Role {
    pub id: RoleId,
    pub guild_id: GuildId,
    pub name: String,
    pub position: i32,
    pub color: u32,
    pub permissions: u64,
    pub created_at: DateTime<Utc>,
}

pub struct CreateRoleInput {
    pub name: String,
    pub permissions: u64,
}
