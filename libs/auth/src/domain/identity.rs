use serde::{Deserialize, Serialize};

use crate::domain::{client::Client, user::User};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Identity {
    User(User),
    Client(Client),
}

impl Identity {
    pub fn id(&self) -> &str {
        match self {
            Identity::User(u) => &u.id,
            Identity::Client(c) => &c.id,
        }
    }

    pub fn is_user(&self) -> bool {
        matches!(self, Identity::User(_))
    }

    pub fn is_client(&self) -> bool {
        matches!(self, Identity::Client(_))
    }

    pub fn username(&self) -> &str {
        match self {
            Identity::User(u) => &u.username,
            Identity::Client(c) => &c.client_id,
        }
    }

    pub fn roles(&self) -> &[String] {
        match self {
            Identity::User(u) => &u.roles,
            Identity::Client(c) => &c.roles,
        }
    }

    pub fn has_role(&self, role: &str) -> bool {
        self.roles().iter().any(|r| r == role)
    }
}
