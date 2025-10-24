use std::fmt::Display;

use chrono::Utc;
use ferriscord_config::{AuthConfig, DatabaseConfig};
use serde::{Deserialize, Serialize};
use uuid::{NoContext, Timestamp, Uuid};

pub mod errors;

pub mod common;
pub mod guild;
pub mod member;
pub mod role;

pub struct Config {
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct Id(pub Uuid);

impl Id {
    pub fn new() -> Self {
        let now = Utc::now();
        let seconds = now.timestamp().try_into().unwrap_or(0);
        let timestamp = Timestamp::from_unix(NoContext, seconds, 0);

        Self(Uuid::new_v7(timestamp))
    }

    pub fn get_uuid(&self) -> Uuid {
        self.0
    }
}

impl Default for Id {
    fn default() -> Self {
        Self::new()
    }
}

impl Display for Id {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
