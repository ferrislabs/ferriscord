use ferriscord_domain::{ChannelId, UserId};

use crate::domain::entities::notification::NotificationKind;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Preference {
    pub user_id: UserId,
    pub channel_id: Option<ChannelId>,
    pub notifications_enabled: bool,
}

impl Preference {
    pub fn allows(&self, kind: &NotificationKind) -> bool {
        // Par défaut, on mute tout le canal si notifications_enabled = false
        self.notifications_enabled || matches!(kind, NotificationKind::SystemAlert)
    }
}
