use std::fmt::Display;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::Id;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
pub struct GuildId(pub Id);

impl GuildId {
    pub fn get_uuid(&self) -> &uuid::Uuid {
        &self.0.0
    }
}

impl From<Uuid> for GuildId {
    fn from(id: Uuid) -> Self {
        GuildId(Id(id))
    }
}

impl Display for GuildId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, ToSchema)]
pub struct OwnerId(pub Id);

impl From<&str> for OwnerId {
    fn from(value: &str) -> Self {
        let uuid = Uuid::parse_str(value).expect("Invalid UUID string");
        OwnerId(Id(uuid))
    }
}

impl OwnerId {
    pub fn get_uuid(&self) -> &uuid::Uuid {
        &self.0.0
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, ToSchema)]
pub struct Guild {
    pub id: GuildId,
    pub name: String,
    pub slug: String,
    pub owner_id: OwnerId,
    pub created_at: DateTime<Utc>,
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
