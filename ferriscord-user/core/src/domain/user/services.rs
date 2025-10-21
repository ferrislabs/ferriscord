use crate::{
    common::{CoreError, Service},
    user::{
        User, UserId,
        ports::{UserRepository, UserService},
    },
};

impl<U> UserService for Service<U>
where
    U: UserRepository,
{
    async fn get_profile(&self, id: UserId) -> Result<Option<User>, CoreError> {
        self.user_repository.find_by_id(id).await
    }
}
