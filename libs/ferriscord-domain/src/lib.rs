pub(crate) mod ids;

pub use ids::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserStatus {
    Online,
    Away,
    DoNotDisturb,
    Invisible,
    Offline,
}

impl UserStatus {
    pub fn is_available_for_notifications(&self) -> bool {
        !matches!(self, UserStatus::DoNotDisturb | UserStatus::Invisible)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChannelType {
    Text,
    Voice,
    Category,
}
