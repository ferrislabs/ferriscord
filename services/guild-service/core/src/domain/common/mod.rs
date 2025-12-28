use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_entities::{
    guild::GuildId,
    role::{PermissionContext, Role},
};
use ferriscord_permission::Permissions;

use crate::domain::{errors::CoreError, guild::ports::GuildPort, role::ports::RoleRepository};

#[derive(Clone)]
pub struct Service<G, A, R>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
{
    pub(crate) guild_repository: G,
    pub auth_repository: A,
    pub(crate) role_repository: R,
}

impl<G, A, R> Service<G, A, R>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
{
    pub(crate) async fn build_permission_context(
        &self,
        identity: &Identity,
        guild_id: &GuildId,
    ) -> Result<PermissionContext, CoreError> {
        // 1. Check if user is the guild owner
        let guild =
            self.guild_repository
                .find_by_id(guild_id)
                .await?
                .ok_or(CoreError::GuildNotFound {
                    guild_id: guild_id.clone(),
                })?;

        let user_roles = self
            .get_user_roles_in_guild(identity.id(), guild_id)
            .await?;

        let mut context = PermissionContext::new(identity.id().to_string(), guild_id.to_string());

        for role in user_roles {
            context = context.add_role(role);
        }

        if guild.owner_id.0.to_string() == identity.id() {
            let owner_role = Role::new(
                guild_id.clone(),
                "Owner".to_string(),
                Permissions::ADMINISTRATOR,
            );
            context = context.add_role(owner_role);
        }

        Ok(context)
    }

    async fn get_user_roles_in_guild(
        &self,
        _user_id: &str,
        guild_id: &GuildId,
    ) -> Result<Vec<Role>, CoreError> {
        // TODO: You need to implement this method
        // This should:
        // 1. Find the member record for this user in this guild
        // 2. Get all role assignments for this member
        // 3. Return the roles

        // For now, return everyone role as default
        Ok(vec![Role::everyone(guild_id.clone())])
    }
}
