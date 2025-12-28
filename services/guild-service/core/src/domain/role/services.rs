use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_entities::{guild::GuildId, role::Role};
use ferriscord_pagination::{PaginatedResponse, PaginationBuilder, PaginationParams};
use ferriscord_permission::{Permissions, require_permission};

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::ports::GuildPort,
    role::{
        entities::{CreateRoleInput, DeleteRoleInput, FindRoleInput, FindRolesInput},
        ports::{RoleRepository, RoleService},
    },
};

impl<G, A, R> RoleService for Service<G, A, R>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
{
    async fn create_role(
        &self,
        identity: Identity,
        input: CreateRoleInput,
        guild_id: GuildId,
    ) -> Result<Role, CoreError> {
        // check if the user has permission to create role in the guild
        // @todo: implement permission check
        let mut permission_context = self.build_permission_context(&identity, &guild_id).await?;

        require_permission!(permission_context, Permissions::MANAGE_ROLES);

        self.role_repository
            .insert(
                &input.name,
                input.color.unwrap_or_default(),
                input.permissions,
                &guild_id,
            )
            .await
    }

    async fn find_role(
        &self,
        _identity: Identity,
        input: FindRoleInput,
    ) -> Result<Role, CoreError> {
        // check if the user has permission to create role in the guild
        // @todo: implement permission check

        self.role_repository.find_by_id(input.role_id).await
    }

    async fn delete_role(
        &self,
        _identity: Identity,
        input: DeleteRoleInput,
    ) -> Result<(), CoreError> {
        // check if the user has permission to create role in the guild
        // @todo: implement permission check

        self.role_repository.delete_by_id(input.role_id).await?;
        Ok(())
    }

    async fn find_roles(
        &self,
        _identity: Identity,
        input: FindRolesInput,
    ) -> Result<PaginatedResponse<Vec<Role>>, CoreError> {
        let page = input.page.unwrap_or(1);
        let per_page = input.per_page.unwrap_or(50);
        let params = PaginationParams {
            page: page as u32,
            per_page: per_page as u32,
        };

        let (roles, total) = self
            .role_repository
            .find_by_guild_id(input.guild_id, params)
            .await?;

        let response = PaginationBuilder::new("test").build(roles, params, total);

        Ok(response)
    }
}
