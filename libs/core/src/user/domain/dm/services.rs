use ferriscord_auth::AuthRepository;
use ferriscord_entities::{friendship::DmChannel, message::Message};
use uuid::Uuid;

use crate::user::domain::{
    common::{CoreError, Service},
    dm::ports::{DmAttachmentInput, DmRepository, DmService},
    friend::ports::FriendRepository,
    user::ports::UserRepository,
};

impl<U, A, F, D> DmService for Service<U, A, F, D>
where
    U: UserRepository,
    A: AuthRepository,
    F: FriendRepository,
    D: DmRepository,
{
    async fn create_or_get(
        &self,
        caller_sub: &str,
        recipient_id: Uuid,
    ) -> Result<DmChannel, CoreError> {
        self.dm_repository.create_or_get(caller_sub, recipient_id).await
    }

    async fn list(&self, caller_sub: &str) -> Result<Vec<DmChannel>, CoreError> {
        self.dm_repository.list(caller_sub).await
    }

    async fn get_messages(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        before: Option<Uuid>,
        limit: u32,
    ) -> Result<Vec<Message>, CoreError> {
        self.dm_repository.get_messages(caller_sub, channel_id, before, limit).await
    }

    async fn send_message(
        &self,
        caller_sub: &str,
        channel_id: Uuid,
        content: String,
        attachments: Vec<DmAttachmentInput>,
    ) -> Result<Message, CoreError> {
        self.dm_repository.send_message(caller_sub, channel_id, content, attachments).await
    }
}
