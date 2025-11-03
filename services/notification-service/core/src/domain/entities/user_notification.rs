use chrono::{DateTime, Utc};
use ferriscord_domain::{NotificationId, UserId, UserNotificationId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserNotification {
    pub id: UserNotificationId,
    pub notification_id: NotificationId,
    pub user_id: UserId,
    pub delivered_at: Option<DateTime<Utc>>,
    pub read_at: Option<DateTime<Utc>>,
}
