use ferriscord_auth::Identity;
use ferriscord_entities::{
    guild::GuildId,
    role::{Role, RoleId},
};
use ferriscord_pagination::{PaginatedResponse, PaginationParams};

use crate::domain::{
    errors::CoreError,
    role::entities::{CreateRoleInput, DeleteRoleInput, FindRoleInput, FindRolesInput},
};

pub trait RoleService: Send + Sync {
    fn create_role(
        &self,
        identity: Identity,
        input: CreateRoleInput,
        guild_id: GuildId,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
    fn find_role(
        &self,
        identity: Identity,
        input: FindRoleInput,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
    fn find_roles(
        &self,
        identity: Identity,
        input: FindRolesInput,
    ) -> impl Future<Output = Result<PaginatedResponse<Vec<Role>>, CoreError>> + Send;
    fn delete_role(
        &self,
        identity: Identity,
        input: DeleteRoleInput,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
}

pub trait RoleRepository: Send + Sync {
    fn insert(
        &self,
        name: &str,
        color: u32,
        permissions: u64,
        guild_id: &GuildId,
    ) -> impl Future<Output = Result<Role, CoreError>> + Send;
    fn find_by_id(&self, id: RoleId) -> impl Future<Output = Result<Role, CoreError>> + Send;
    fn find_by_guild_id(
        &self,
        guild_id: GuildId,
        params: PaginationParams,
    ) -> impl Future<Output = Result<(Vec<Role>, u64), CoreError>> + Send;
    fn delete_by_id(&self, id: RoleId) -> impl Future<Output = Result<(), CoreError>> + Send;
}
