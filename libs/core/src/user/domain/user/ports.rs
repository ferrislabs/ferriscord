use std::future::Future;

use crate::user::domain::{
    common::CoreError,
    user::{User, UserId},
};

pub trait UserService: Send + Sync {
    fn get_profile(
        &self,
        id: UserId,
    ) -> impl Future<Output = Result<Option<User>, CoreError>> + Send;

    fn get_me(
        &self,
        sub: &str,
    ) -> impl Future<Output = Result<Option<User>, CoreError>> + Send;

    fn upsert_by_sub(
        &self,
        sub: &str,
        username: &str,
    ) -> impl Future<Output = Result<User, CoreError>> + Send;

    fn update_profile(
        &self,
        sub: &str,
        display_name: Option<String>,
        avatar_url: Option<String>,
        bio: Option<String>,
        banner_url: Option<String>,
    ) -> impl Future<Output = Result<User, CoreError>> + Send;
}

pub trait UserRepository: Send + Sync {
    fn insert(&self, user: &User) -> impl Future<Output = Result<(), CoreError>> + Send;

    fn find_by_id(
        &self,
        id: UserId,
    ) -> impl Future<Output = Result<Option<User>, CoreError>> + Send;

    fn find_by_sub(
        &self,
        sub: &str,
    ) -> impl Future<Output = Result<Option<User>, CoreError>> + Send;

    fn update_profile(
        &self,
        sub: &str,
        display_name: Option<String>,
        avatar_url: Option<String>,
        bio: Option<String>,
        banner_url: Option<String>,
    ) -> impl Future<Output = Result<User, CoreError>> + Send;
}
