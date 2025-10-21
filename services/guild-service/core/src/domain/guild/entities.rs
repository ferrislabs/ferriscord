use std::fmt::Display;

use chrono::{DateTime, Utc};

use crate::domain::Id;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GuildId(pub Id);

impl Display for GuildId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OwnerId(pub Id);

#[derive(Clone, Debug)]
pub struct Guild {
    pub id: GuildId,
    pub name: String,
    pub slug: String,
    pub owner_id: OwnerId,
    pub created_at: DateTime<Utc>,
}

pub struct CreateGuildInput {
    pub name: String,
    pub owner_id: OwnerId,
}

impl Guild {
    pub fn new(name: String, owner_id: OwnerId) -> Self {
        Self {
            id: GuildId(Id::new()),
            slug: name.to_lowercase().replace(" ", "-"),
            name,
            owner_id,
            created_at: Utc::now(),
        }
    }
}
