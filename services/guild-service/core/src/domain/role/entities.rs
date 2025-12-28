use ferriscord_entities::{guild::GuildId, role::RoleId};

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
