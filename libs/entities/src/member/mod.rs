use std::fmt::Display;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{Id, guild::GuildId, role::Role, user::UserId};

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct MemberId(pub Id);

impl MemberId {
    pub fn get_uuid(&self) -> &Uuid {
        &self.0.0
    }
}

impl From<Uuid> for MemberId {
    fn from(id: Uuid) -> Self {
        MemberId(Id(id))
    }
}

impl Display for MemberId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct Member {
    pub id: MemberId,
    pub guild_id: GuildId,
    pub user_id: UserId,
    pub roles: Vec<Role>,
}
