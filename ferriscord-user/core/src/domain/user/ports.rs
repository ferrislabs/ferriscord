use crate::domain::{
    common::CoreError,
    user::{User, UserId},
};

pub trait UserRepository: Send + Sync {
    async fn insert(&self, user: &User) -> Result<(), CoreError>;
    async fn find_by_id(&self, id: UserId) -> Result<Option<User>, CoreError>;
    async fn find_by_sub(&self, sub: &str) -> Result<Option<User>, CoreError>;
}
