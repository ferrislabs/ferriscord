use crate::domain::{
    errors::CoreError,
    role::entities::{CreateRoleInput, Role},
};

pub trait RoleRepository: Send + Sync {
    fn insert(
        &self,
        input: CreateRoleInput,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
}
