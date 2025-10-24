use crate::domain::{
    errors::CoreError,
    guild::entities::GuildId,
    role::entities::{CreateRoleInput, Role},
};

pub trait RoleService: Send + Sync {
    fn create_role(
        &self,
        input: CreateRoleInput,
        guild_id: GuildId,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
}

pub trait RoleRepository: Send + Sync {
    fn insert(
        &self,
        name: &str,
        color: u32,
        permissions: u64,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
}
