use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_permission::{Permissions, require_permission};

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::{entities::GuildId, ports::GuildPort},
    role::{
        entities::{CreateRoleInput, Role, RoleId},
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

    async fn find_role(&self, id: RoleId) -> Result<Role, CoreError> {
        self.role_repository.find_by_id(id).await
    }
}
