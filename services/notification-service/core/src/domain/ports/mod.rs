use ferriscord_domain::{NotificationId, UserId};

use crate::domain::entities::notification::Notification;

pub trait NotificationRepository {
    fn save(
        &self,
        notification: &Notification,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
    fn find_by_user(
        &self,
        user_id: &UserId,
    ) -> impl Future<Output = Result<Vec<Notification>, CoreError>> + Send;
    fn mark_as_read(
        &self,
        notification_id: &NotificationId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
}
