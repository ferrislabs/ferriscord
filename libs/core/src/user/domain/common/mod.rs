use thiserror::Error;

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
