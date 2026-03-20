use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use uuid::Uuid;
use utoipa::ToSchema;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, Default)]
#[serde(rename_all = "snake_case")]
pub enum PresenceStatus {
    Online,
    Idle,
    DoNotDisturb,
    #[default]
    Offline,
}

#[derive(Clone)]
pub struct PresenceStore {
    users: Arc<RwLock<HashMap<Uuid, PresenceStatus>>>,
}

impl PresenceStore {
    pub fn new() -> Self {
        Self { users: Arc::new(RwLock::new(HashMap::new())) }
    }

    pub async fn set(&self, user_id: Uuid, status: PresenceStatus) {
        let mut map = self.users.write().await;
        if status == PresenceStatus::Offline {
            map.remove(&user_id);
        } else {
            map.insert(user_id, status);
        }
    }

    pub async fn get(&self, user_id: Uuid) -> PresenceStatus {
        let map = self.users.read().await;
        map.get(&user_id).cloned().unwrap_or_default()
    }

    pub async fn get_many(&self, user_ids: &[Uuid]) -> HashMap<Uuid, PresenceStatus> {
        let map = self.users.read().await;
        user_ids.iter().map(|id| (*id, map.get(id).cloned().unwrap_or_default())).collect()
    }
}
