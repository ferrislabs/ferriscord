use ferriscord_auth::Identity;
use ferriscord_entities::{
    channel::ChannelId,
    guild::GuildId,
    role::{PermissionContext, Role},
};
use ferriscord_pagination::PaginationParams;
use ferriscord_permission::PermissionOverrides;
use ferriscord_permission::Permissions;

use crate::guild::domain::{
    channel::ports::ChannelPort, errors::CoreError, guild::ports::GuildPort,
    member::ports::MemberRepository, role::ports::RoleRepository,
};

fn default_everyone_permissions() -> Permissions {
    Permissions::VIEW_GUILD | Permissions::VIEW_CHANNEL | Permissions::SEND_MESSAGES
}

pub(crate) async fn build_permission_context<
    G: GuildPort,
    M: MemberRepository,
    R: RoleRepository,
>(
    guild_repository: &G,
    member_repository: &M,
    role_repository: &R,
    identity: &Identity,
    guild_id: &GuildId,
) -> Result<PermissionContext, CoreError> {
    let guild = guild_repository
        .find_by_id(guild_id)
        .await?
        .ok_or(CoreError::GuildNotFound {
            guild_id: guild_id.clone(),
        })?;

    let mut context = PermissionContext::new(identity.id().to_string(), guild_id.to_string());
    let roles = role_repository
        .find_by_guild_id(
            guild_id.clone(),
            PaginationParams {
                page: 1,
                per_page: 100,
            },
        )
        .await?
        .0;

    if let Some(everyone_role) = roles
        .iter()
        .find(|role| role.name == "@everyone" || role.name == "everyone")
    {
        let mut everyone_role = everyone_role.clone();
        if everyone_role.permissions.is_empty() {
            everyone_role.permissions = default_everyone_permissions();
        }
        context = context.add_role(everyone_role);
    } else {
        context = context.add_role(Role::everyone(guild_id.clone()));
    }

    if guild.owner_id.0.to_string() == identity.id() {
        let owner_role = Role::new(
            guild_id.clone(),
            "Owner".to_string(),
            Permissions::ADMINISTRATOR,
        );
        context = context.add_role(owner_role);
    }

    let members = member_repository.list_members(guild_id).await?;
    if let Some(member) = members.into_iter().find(|member| {
        member.user_id.to_string() == identity.id() || member.username == identity.username()
    }) {
        for role in roles.into_iter().filter(|role| {
            member
                .roles
                .iter()
                .any(|member_role| member_role.id == role.id.0.get_uuid())
        }) {
            context = context.add_role(role);
        }
    }

    Ok(context)
}

pub(crate) async fn build_channel_permission_context<
    G: GuildPort,
    M: MemberRepository,
    R: RoleRepository,
    C: ChannelPort,
>(
    guild_repository: &G,
    member_repository: &M,
    role_repository: &R,
    channel_repository: &C,
    identity: &Identity,
    guild_id: &GuildId,
    channel_id: &ChannelId,
) -> Result<PermissionContext, CoreError> {
    let mut context = build_permission_context(
        guild_repository,
        member_repository,
        role_repository,
        identity,
        guild_id,
    )
    .await?
    .with_channel(channel_id.to_string());

    let channel = channel_repository
        .find_by_id(channel_id)
        .await?
        .ok_or_else(|| CoreError::ChannelNotFound {
            channel_id: channel_id.clone(),
        })?;

    if let Some(parent_id) = &channel.parent_id {
        if let Some(parent) = channel_repository.find_by_id(parent_id).await? {
            for overwrite in parent.permission_overwrites {
                context = context.add_channel_override(
                    overwrite.id.to_string(),
                    PermissionOverrides {
                        allow: Permissions::from_bits_truncate(overwrite.allow),
                        deny: Permissions::from_bits_truncate(overwrite.deny),
                    },
                );
            }
        }
    }

    for overwrite in channel.permission_overwrites {
        context = context.add_channel_override(
            overwrite.id.to_string(),
            PermissionOverrides {
                allow: Permissions::from_bits_truncate(overwrite.allow),
                deny: Permissions::from_bits_truncate(overwrite.deny),
            },
        );
    }

    Ok(context)
}
