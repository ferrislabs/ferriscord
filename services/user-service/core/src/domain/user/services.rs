use ferriscord_auth::AuthRepository;

use crate::{
    common::{CoreError, Service},
    user::{
        User, UserId,
        ports::{UserRepository, UserService},
    },
};

impl<U, A> UserService for Service<U, A>
where
    U: UserRepository,
    A: AuthRepository,
{
    async fn get_profile(&self, id: UserId) -> Result<Option<User>, CoreError> {
        self.user_repository.find_by_id(id).await
    }
}
