use ferriscord_entities::{guild::GuildId, role::RoleId, user::UserId};

pub struct CreateRoleInput {
    pub name: String,
    pub permissions: u64,
    pub color: Option<u32>,
}

pub struct DeleteRoleInput {
    pub role_id: RoleId,
    pub guild_id: GuildId,
}

pub struct FindRoleInput {
    pub role_id: RoleId,
    pub guild_id: GuildId,
}

pub struct FindRolesInput {
    pub guild_id: GuildId,
    pub per_page: Option<usize>,
    pub page: Option<usize>,
}

pub struct AssignRoleInput {
    pub guild_id: GuildId,
    pub user_id: UserId,
    pub role_id: RoleId,
}

pub struct RemoveRoleInput {
    pub guild_id: GuildId,
    pub user_id: UserId,
    pub role_id: RoleId,
}
