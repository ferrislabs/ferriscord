use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub mod ports;
mod services;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UserId(pub Uuid);

impl From<Uuid> for UserId {
    fn from(value: Uuid) -> Self {
        Self { 0: value }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct User {
    pub id: UserId,
    pub oauth_sub: String,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub fn new(sub: impl Into<String>, username: impl Into<String>) -> Self {
        let now = Utc::now();

        Self {
            id: UserId(Uuid::now_v7()),
            oauth_sub: sub.into(),
            username: username.into(),
            display_name: None,
            avatar_url: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn update_profile(&mut self, display: Option<String>, avatar: Option<String>) {
        self.display_name = display;
        self.avatar_url = avatar;
        self.updated_at = Utc::now();
    }
}
