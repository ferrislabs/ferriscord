use std::{collections::HashMap, fmt::Display};

use chrono::{DateTime, Utc};
use ferriscord_permission::{PermissionOverrides, Permissions};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{Id, guild::GuildId};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, ToSchema)]
pub struct RoleId(pub Id);

impl Display for RoleId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Uuid> for RoleId {
    fn from(id: Uuid) -> Self {
        RoleId(Id(id))
    }
}

#[derive(Debug, Clone, Eq, Serialize, Deserialize, PartialEq, ToSchema)]
pub struct Role {
    pub id: RoleId,
    pub guild_id: GuildId,
    pub name: String,
    pub position: i32,
    pub color: u32,
    pub permissions: Permissions,
    pub hoist: bool,
    pub mentionable: bool,
    pub created_at: DateTime<Utc>,
}

impl Role {
    pub fn new(guild_id: GuildId, name: String, permissions: Permissions) -> Self {
        Self {
            id: RoleId(Id::new()),
            name,
            permissions,
            color: 0,
            guild_id,
            hoist: false,
            mentionable: false,
            position: 0,
            created_at: Utc::now(),
        }
    }

    pub fn everyone(guild_id: GuildId) -> Self {
        Self::new(
            guild_id,
            "@everyone".to_string(),
            Permissions::VIEW_GUILD | Permissions::VIEW_CHANNEL | Permissions::SEND_MESSAGES,
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionContext {
    pub user_id: String,
    pub guild_id: String,
    pub channel_id: Option<String>,
    pub roles: Vec<Role>,
    pub channel_overrides: HashMap<String, PermissionOverrides>,
    pub computed_permissions: Option<Permissions>,
}

impl PermissionContext {
    pub fn new(user_id: String, guild_id: String) -> Self {
        Self {
            user_id,
            guild_id,
            channel_id: None,
            roles: Vec::new(),
            channel_overrides: HashMap::new(),
            computed_permissions: None,
        }
    }

    pub fn with_channel(mut self, channel_id: String) -> Self {
        self.channel_id = Some(channel_id);
        self.computed_permissions = None; // Invalidate cache
        self
    }

    pub fn add_role(mut self, role: Role) -> Self {
        self.roles.push(role);
        self.computed_permissions = None; // Invalidate cache
        self
    }

    pub fn add_channel_override(
        mut self,
        target_id: String,
        overrides: PermissionOverrides,
    ) -> Self {
        self.channel_overrides.insert(target_id, overrides);
        self.computed_permissions = None; // Invalidate cache
        self
    }

    pub fn compute_permissions(&mut self) -> Permissions {
        if let Some(cached) = self.computed_permissions {
            return cached;
        }

        // Start with base permissions from roles
        let mut permissions = self.compute_base_permissions();

        // Apply channel-specific overrides if we're in a channel context
        if let Some(channel_id) = &self.channel_id {
            permissions = self.apply_channel_overrides(permissions, channel_id);
        }

        self.computed_permissions = Some(permissions);
        permissions
    }

    fn compute_base_permissions(&self) -> Permissions {
        // Sort roles by position (higher position = higher priority)
        let mut sorted_roles = self.roles.clone();
        sorted_roles.sort_by(|a, b| a.position.cmp(&b.position));

        let mut permissions = Permissions::empty();

        // Combine all role permissions
        for role in &sorted_roles {
            permissions |= role.permissions;
        }

        // If user has administrator, they get all permissions
        if permissions.contains(Permissions::ADMINISTRATOR) {
            return Permissions::all();
        }

        permissions
    }

    fn apply_channel_overrides(
        &self,
        base_permissions: Permissions,
        _channel_id: &str,
    ) -> Permissions {
        let mut permissions = base_permissions;

        // Apply role overrides first (in position order)
        let mut sorted_roles = self.roles.clone();
        sorted_roles.sort_by(|a, b| a.position.cmp(&b.position));

        for role in &sorted_roles {
            if let Some(overrides) = self.channel_overrides.get(&role.id.to_string()) {
                permissions = overrides.apply_to(permissions);
            }
        }

        // Apply user-specific overrides last (highest priority)
        if let Some(user_overrides) = self.channel_overrides.get(&self.user_id) {
            permissions = user_overrides.apply_to(permissions);
        }

        permissions
    }

    pub fn can(&mut self, permission: Permissions) -> bool {
        let computed = self.compute_permissions();
        computed.contains(permission) || computed.contains(Permissions::ADMINISTRATOR)
    }

    pub fn can_any(&mut self, permissions: &[Permissions]) -> bool {
        let computed = self.compute_permissions();
        if computed.contains(Permissions::ADMINISTRATOR) {
            return true;
        }
        permissions.iter().any(|&perm| computed.contains(perm))
    }

    pub fn can_all(&mut self, permissions: &[Permissions]) -> bool {
        let computed = self.compute_permissions();
        if computed.contains(Permissions::ADMINISTRATOR) {
            return true;
        }
        permissions.iter().all(|&perm| computed.contains(perm))
    }

    pub fn lacks(&mut self, permission: Permissions) -> bool {
        !self.can(permission)
    }

    pub fn is_admin(&mut self) -> bool {
        self.can(Permissions::ADMINISTRATOR)
    }

    pub fn get_permissions(&mut self) -> Permissions {
        self.compute_permissions()
    }
}
