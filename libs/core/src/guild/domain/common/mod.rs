use ferriscord_auth::Identity;
use ferriscord_entities::{
    guild::GuildId,
    role::{PermissionContext, Role},
};
use ferriscord_permission::Permissions;

use crate::guild::domain::{errors::CoreError, guild::ports::GuildPort};

pub(crate) async fn build_permission_context<G: GuildPort>(
    guild_repository: &G,
    identity: &Identity,
    guild_id: &GuildId,
) -> Result<PermissionContext, CoreError> {
    let guild = guild_repository
        .find_by_id(guild_id)
        .await?
        .ok_or(CoreError::GuildNotFound { guild_id: guild_id.clone() })?;

    let mut context = PermissionContext::new(identity.id().to_string(), guild_id.to_string());

    context = context.add_role(Role::everyone(guild_id.clone()));

    if guild.owner_id.0.to_string() == identity.id() {
        let owner_role =
            Role::new(guild_id.clone(), "Owner".to_string(), Permissions::ADMINISTRATOR);
        context = context.add_role(owner_role);
    }

    Ok(context)
}
