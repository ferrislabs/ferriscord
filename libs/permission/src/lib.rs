use bitflags::bitflags;
use serde::{Deserialize, Serialize};

bitflags! {
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Permissions: u64 {
        const VIEW_GUILD        = 1 << 0;
        const SEND_MESSAGES     = 1 << 1;
        const MANAGE_MESSAGES   = 1 << 2;
        const MANAGE_CHANNELS   = 1 << 3;
        const MANAGE_ROLES      = 1 << 4;
        const MANAGE_GUILD      = 1 << 5;
        const ADMINISTRATOR     = 1 << 60;
    }
}

impl Permissions {
    pub fn can(&self, perm: Permissions) -> bool {
        self.contains(perm) || self.contains(Permissions::ADMINISTRATOR)
    }

    pub fn union_all(perms: &[Permissions]) -> Permissions {
        let mut result = Permissions::empty();

        for p in perms {
            result |= p.clone();
        }

        result
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionContext {
    pub user_id: String,
    pub guild_id: String,
    pub aggregated: Permissions,
}
