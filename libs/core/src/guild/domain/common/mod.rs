use ferriscord_auth::{AuthRepository, Identity};
use ferriscord_entities::{
    guild::GuildId,
    role::{PermissionContext, Role},
};
use ferriscord_permission::Permissions;

use crate::guild::domain::{
    channel::ports::ChannelPort,
    errors::CoreError,
    guild::ports::GuildPort,
    member::ports::MemberRepository,
    message::ports::MessagePort,
    role::ports::RoleRepository,
};

#[derive(Clone)]
pub struct Service<G, A, R, M, C, Msg>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
    Msg: MessagePort,
{
    pub(crate) guild_repository: G,
    pub auth_repository: A,
    pub(crate) role_repository: R,
    pub(crate) member_repository: M,
    pub(crate) channel_repository: C,
    pub(crate) message_repository: Msg,
}

impl<G, A, R, M, C, Msg> Service<G, A, R, M, C, Msg>
where
    G: GuildPort,
    A: AuthRepository,
    R: RoleRepository,
    M: MemberRepository,
    C: ChannelPort,
    Msg: MessagePort,
{
    pub(crate) async fn build_permission_context(
        &self,
        identity: &Identity,
        guild_id: &GuildId,
    ) -> Result<PermissionContext, CoreError> {
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
        Ok(vec![Role::everyone(guild_id.clone())])
    }
}
