use ferriscord_auth::AuthRepository;

use crate::user::domain::{
    common::{CoreError, Service},
    dm::ports::DmRepository,
    friend::ports::FriendRepository,
    user::{
        User, UserId,
        ports::{UserRepository, UserService},
    },
};

impl<U, A, F, D> UserService for Service<U, A, F, D>
where
    U: UserRepository,
    A: AuthRepository,
    F: FriendRepository,
    D: DmRepository,
{
    async fn get_profile(&self, id: UserId) -> Result<Option<User>, CoreError> {
        self.user_repository.find_by_id(id).await
    }

    async fn get_me(&self, sub: &str) -> Result<Option<User>, CoreError> {
        self.user_repository.find_by_sub(sub).await
    }

    async fn upsert_by_sub(&self, sub: &str, username: &str) -> Result<User, CoreError> {
        if let Some(user) = self.user_repository.find_by_sub(sub).await? {
            return Ok(user);
        }
        let user = User::new(sub, username);
        self.user_repository.insert(&user).await?;
        Ok(user)
    }

    async fn update_profile(
        &self,
        sub: &str,
        display_name: Option<String>,
        avatar_url: Option<String>,
    ) -> Result<User, CoreError> {
        self.user_repository.update_profile(sub, display_name, avatar_url).await
    }
}
