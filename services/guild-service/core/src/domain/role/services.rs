use ferriscord_auth::AuthRepository;

use crate::domain::{
    common::Service,
    errors::CoreError,
    guild::{
        entities::{Guild, GuildId},
        ports::GuildPort,
    },
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
        input: CreateRoleInput,
        guild_id: GuildId,
    ) -> Result<Role, CoreError> {
        self.role_repository
            .insert(&input.name, 0, input.permissions, &guild_id)
            .await
    }

    async fn find_role(&self, id: RoleId) -> Result<Role, CoreError> {
        self.role_repository.find_by_id(id).await
    }
}
