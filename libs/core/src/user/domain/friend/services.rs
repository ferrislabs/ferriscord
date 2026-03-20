use ferriscord_entities::friendship::Friendship;
use uuid::Uuid;

use crate::user::domain::{
    common::CoreError,
    friend::ports::{FriendRepository, FriendService},
};

#[derive(Clone)]
pub struct FriendServiceImpl<F: FriendRepository> {
    pub(crate) friend_repository: F,
}

impl<F: FriendRepository> FriendService for FriendServiceImpl<F> {
    async fn send_request(
        &self,
        caller_sub: &str,
        addressee_username: &str,
    ) -> Result<Friendship, CoreError> {
        self.friend_repository.send_request(caller_sub, addressee_username).await
    }

    async fn accept(&self, caller_sub: &str, request_id: Uuid) -> Result<Friendship, CoreError> {
        self.friend_repository.accept(caller_sub, request_id).await
    }

    async fn decline(&self, caller_sub: &str, request_id: Uuid) -> Result<(), CoreError> {
        self.friend_repository.decline(caller_sub, request_id).await
    }

    async fn remove(&self, caller_sub: &str, friend_user_id: Uuid) -> Result<(), CoreError> {
        self.friend_repository.remove(caller_sub, friend_user_id).await
    }

    async fn list_friends(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        self.friend_repository.list_friends(caller_sub).await
    }

    async fn list_incoming(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        self.friend_repository.list_incoming(caller_sub).await
    }

    async fn list_outgoing(&self, caller_sub: &str) -> Result<Vec<Friendship>, CoreError> {
        self.friend_repository.list_outgoing(caller_sub).await
    }
}
