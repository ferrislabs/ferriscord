use std::future::Future;

use ferriscord_entities::friendship::Friendship;
use uuid::Uuid;

use crate::user::domain::common::CoreError;

pub trait FriendRepository: Send + Sync {
    fn send_request(
        &self,
        requester_sub: &str,
        addressee_username: &str,
    ) -> impl Future<Output = Result<Friendship, CoreError>> + Send;

    fn accept(
        &self,
        caller_sub: &str,
        request_id: Uuid,
    ) -> impl Future<Output = Result<Friendship, CoreError>> + Send;

    fn decline(
        &self,
        caller_sub: &str,
        request_id: Uuid,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn remove(
        &self,
        caller_sub: &str,
        friend_user_id: Uuid,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn list_friends(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;

    fn list_incoming(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;

    fn list_outgoing(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;
}

pub trait FriendService: Send + Sync {
    fn send_request(
        &self,
        caller_sub: &str,
        addressee_username: &str,
    ) -> impl Future<Output = Result<Friendship, CoreError>> + Send;

    fn accept(
        &self,
        caller_sub: &str,
        request_id: Uuid,
    ) -> impl Future<Output = Result<Friendship, CoreError>> + Send;

    fn decline(
        &self,
        caller_sub: &str,
        request_id: Uuid,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn remove(
        &self,
        caller_sub: &str,
        friend_user_id: Uuid,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn list_friends(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;

    fn list_incoming(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;

    fn list_outgoing(
        &self,
        caller_sub: &str,
    ) -> impl Future<Output = Result<Vec<Friendship>, CoreError>> + Send;
}
