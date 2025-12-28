use std::fmt::Display;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::Id;

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct UserId(pub Id);

impl UserId {
    pub fn get_uuid(&self) -> &uuid::Uuid {
        &self.0.0
    }
}

impl From<Uuid> for UserId {
    fn from(id: Uuid) -> Self {
        UserId(Id(id))
    }
}

impl Display for UserId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
