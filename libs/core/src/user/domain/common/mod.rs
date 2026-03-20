use ferriscord_auth::AuthRepository;
use thiserror::Error;

use crate::user::domain::{
    dm::ports::DmRepository,
    friend::ports::FriendRepository,
    user::ports::UserRepository,
};

#[derive(Clone)]
pub struct Service<U, A, F, D>
where
    U: UserRepository,
    A: AuthRepository,
    F: FriendRepository,
    D: DmRepository,
{
    pub(crate) user_repository: U,
    pub auth_repository: A,
    pub(crate) friend_repository: F,
    pub(crate) dm_repository: D,
}

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("internal server error: {message}")]
    InternalServerError { message: String },

    #[error("infrastructure database setup error: {details}")]
    InfrastructureDatabaseSetupError { details: String },

    #[error("user not found")]
    NotFound,

    #[error("friend request not found")]
    FriendRequestNotFound,

    #[error("friendship already exists")]
    AlreadyFriends,

    #[error("not friends with this user")]
    NotFriends,

    #[error("dm channel not found or access denied")]
    DmChannelNotFound,

    #[error("cannot send a friend request to yourself")]
    SelfFriendRequest,
}
