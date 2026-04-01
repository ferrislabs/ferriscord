use ferriscord_auth::Identity;
use ferriscord_entities::{guild::GuildId, role::Role};
use ferriscord_pagination::{PaginatedResponse, PaginationBuilder, PaginationParams};
use ferriscord_permission::{Permissions, require_permission};

use crate::guild::domain::{
    common::build_permission_context,
    errors::CoreError,
    guild::ports::GuildPort,
    member::ports::MemberRepository,
    role::{
        entities::{
            AssignRoleInput, CreateRoleInput, DeleteRoleInput, FindRoleInput, FindRolesInput,
            RemoveRoleInput, UpdateRoleInput,
        },
        ports::{RoleRepository, RoleService},
    },
};

#[derive(Clone)]
pub struct RoleServiceImpl<G, R, M>
where
    G: GuildPort,
    R: RoleRepository,
    M: MemberRepository,
{
    pub(crate) guild_repository: G,
    pub(crate) role_repository: R,
    pub(crate) member_repository: M,
}

impl<G, R, M> RoleService for RoleServiceImpl<G, R, M>
where
    G: GuildPort,
    R: RoleRepository,
    M: MemberRepository,
{
    async fn create_role(
        &self,
        identity: Identity,
        input: CreateRoleInput,
        guild_id: GuildId,
    ) -> Result<Role, CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &guild_id,
        )
        .await?;

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
        self.role_repository.find_by_id(input.role_id).await
    }

    async fn delete_role(
        &self,
        _identity: Identity,
        input: DeleteRoleInput,
    ) -> Result<(), CoreError> {
        self.role_repository.delete_by_id(input.role_id).await?;
        Ok(())
    }

    async fn update_role(
        &self,
        identity: Identity,
        input: UpdateRoleInput,
    ) -> Result<Role, CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &input.guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_ROLES);

        self.role_repository
            .update_by_id(
                &input.guild_id,
                input.role_id,
                &input.name,
                input.color.unwrap_or_default(),
                input.permissions,
            )
            .await
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

    async fn assign_role(
        &self,
        identity: Identity,
        input: AssignRoleInput,
    ) -> Result<(), CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &input.guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_ROLES);

        self.member_repository
            .assign_role(&input.guild_id, &input.user_id, &input.role_id)
            .await
    }

    async fn remove_role(
        &self,
        identity: Identity,
        input: RemoveRoleInput,
    ) -> Result<(), CoreError> {
        let mut permission_context = build_permission_context(
            &self.guild_repository,
            &self.member_repository,
            &self.role_repository,
            &identity,
            &input.guild_id,
        )
        .await?;

        require_permission!(permission_context, Permissions::MANAGE_ROLES);

        self.member_repository
            .remove_role(&input.guild_id, &input.user_id, &input.role_id)
            .await
    }
}
