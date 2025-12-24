use bitflags::bitflags;
use serde::{Deserialize, Serialize};

bitflags! {
    #[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
    pub struct Permissions: u64 {
        // General permissions
        const VIEW_GUILD            = 1 << 0;
        const MANAGE_GUILD          = 1 << 1;
        const MANAGE_ROLES          = 1 << 2;
        const MANAGE_CHANNELS       = 1 << 3;
        const KICK_MEMBERS          = 1 << 4;
        const BAN_MEMBERS           = 1 << 5;
        const CREATE_INSTANT_INVITE = 1 << 6;
        const CHANGE_NICKNAME       = 1 << 7;
        const MANAGE_NICKNAMES      = 1 << 8;
        const MANAGE_EMOJIS         = 1 << 9;
        const MANAGE_WEBHOOKS       = 1 << 10;
        const VIEW_AUDIT_LOG        = 1 << 11;

        // Text channel permissions
        const VIEW_CHANNEL          = 1 << 12;
        const SEND_MESSAGES         = 1 << 13;
        const SEND_TTS_MESSAGES     = 1 << 14;
        const MANAGE_MESSAGES       = 1 << 15;
        const EMBED_LINKS           = 1 << 16;
        const ATTACH_FILES          = 1 << 17;
        const READ_MESSAGE_HISTORY  = 1 << 18;
        const MENTION_EVERYONE      = 1 << 19;
        const USE_EXTERNAL_EMOJIS   = 1 << 20;
        const ADD_REACTIONS         = 1 << 21;
        const USE_SLASH_COMMANDS    = 1 << 22;
        const MANAGE_THREADS        = 1 << 23;
        const CREATE_THREADS        = 1 << 24;
        const SEND_MESSAGES_IN_THREADS = 1 << 25;

        // Voice channel permissions
        const CONNECT               = 1 << 26;
        const SPEAK                 = 1 << 27;
        const MUTE_MEMBERS          = 1 << 28;
        const DEAFEN_MEMBERS        = 1 << 29;
        const MOVE_MEMBERS          = 1 << 30;
        const USE_VAD               = 1 << 31;
        const PRIORITY_SPEAKER      = 1 << 32;
        const STREAM                = 1 << 33;

        // Advanced permissions
        const ADMINISTRATOR         = 1 << 60;

        // Permission groups for convenience
        const TEXT_PERMISSIONS = Self::VIEW_CHANNEL.bits()
            | Self::SEND_MESSAGES.bits()
            | Self::EMBED_LINKS.bits()
            | Self::ATTACH_FILES.bits()
            | Self::READ_MESSAGE_HISTORY.bits()
            | Self::ADD_REACTIONS.bits();

        const VOICE_PERMISSIONS = Self::CONNECT.bits()
            | Self::SPEAK.bits()
            | Self::USE_VAD.bits()
            | Self::STREAM.bits();

        const MODERATION_PERMISSIONS = Self::MANAGE_MESSAGES.bits()
            | Self::KICK_MEMBERS.bits()
            | Self::BAN_MEMBERS.bits()
            | Self::MANAGE_NICKNAMES.bits();

        const ADMIN_PERMISSIONS = Self::MANAGE_GUILD.bits()
            | Self::MANAGE_ROLES.bits()
            | Self::MANAGE_CHANNELS.bits()
            | Self::MANAGE_WEBHOOKS.bits()
            | Self::VIEW_AUDIT_LOG.bits();
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionOverride {
    Allow,
    Deny,
    Inherit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionOverrides {
    pub allow: Permissions,
    pub deny: Permissions,
}

impl PermissionOverrides {
    pub fn new() -> Self {
        Self {
            allow: Permissions::empty(),
            deny: Permissions::empty(),
        }
    }

    pub fn allow(mut self, permission: Permissions) -> Self {
        self.allow |= permission.clone();
        self.deny &= !permission;
        self
    }

    pub fn deny(mut self, permission: Permissions) -> Self {
        self.deny |= permission.clone();
        self.allow &= !permission;
        self
    }

    pub fn apply_to(&self, base_permissions: Permissions) -> Permissions {
        (base_permissions | self.allow.clone()) & !self.deny.clone()
    }
}

impl Default for PermissionOverrides {
    fn default() -> Self {
        Self::new()
    }
}

impl Permissions {
    pub fn can(&self, perm: Permissions) -> bool {
        self.contains(perm) || self.contains(Permissions::ADMINISTRATOR)
    }

    pub fn union_all(perms: &[Permissions]) -> Permissions {
        let mut result = Permissions::empty();

        for &p in perms {
            result |= p;
        }

        result
    }

    pub fn has_any(&self, permissions: &[Permissions]) -> bool {
        if self.contains(Permissions::ADMINISTRATOR) {
            return true;
        }

        permissions.iter().any(|&perm| self.contains(perm))
    }

    pub fn has_all(&self, permissions: &[Permissions]) -> bool {
        if self.contains(Permissions::ADMINISTRATOR) {
            return true;
        }

        permissions.iter().all(|&perm| self.contains(perm))
    }

    pub fn to_vec(&self) -> Vec<&'static str> {
        let mut result = Vec::new();

        let flags = [
            (Permissions::VIEW_GUILD, "VIEW_GUILD"),
            (Permissions::MANAGE_GUILD, "MANAGE_GUILD"),
            (Permissions::MANAGE_ROLES, "MANAGE_ROLES"),
            (Permissions::MANAGE_CHANNELS, "MANAGE_CHANNELS"),
            (Permissions::KICK_MEMBERS, "KICK_MEMBERS"),
            (Permissions::BAN_MEMBERS, "BAN_MEMBERS"),
            (Permissions::CREATE_INSTANT_INVITE, "CREATE_INSTANT_INVITE"),
            (Permissions::CHANGE_NICKNAME, "CHANGE_NICKNAME"),
            (Permissions::MANAGE_NICKNAMES, "MANAGE_NICKNAMES"),
            (Permissions::MANAGE_EMOJIS, "MANAGE_EMOJIS"),
            (Permissions::MANAGE_WEBHOOKS, "MANAGE_WEBHOOKS"),
            (Permissions::VIEW_AUDIT_LOG, "VIEW_AUDIT_LOG"),
            (Permissions::VIEW_CHANNEL, "VIEW_CHANNEL"),
            (Permissions::SEND_MESSAGES, "SEND_MESSAGES"),
            (Permissions::SEND_TTS_MESSAGES, "SEND_TTS_MESSAGES"),
            (Permissions::MANAGE_MESSAGES, "MANAGE_MESSAGES"),
            (Permissions::EMBED_LINKS, "EMBED_LINKS"),
            (Permissions::ATTACH_FILES, "ATTACH_FILES"),
            (Permissions::READ_MESSAGE_HISTORY, "READ_MESSAGE_HISTORY"),
            (Permissions::MENTION_EVERYONE, "MENTION_EVERYONE"),
            (Permissions::USE_EXTERNAL_EMOJIS, "USE_EXTERNAL_EMOJIS"),
            (Permissions::ADD_REACTIONS, "ADD_REACTIONS"),
            (Permissions::USE_SLASH_COMMANDS, "USE_SLASH_COMMANDS"),
            (Permissions::MANAGE_THREADS, "MANAGE_THREADS"),
            (Permissions::CREATE_THREADS, "CREATE_THREADS"),
            (
                Permissions::SEND_MESSAGES_IN_THREADS,
                "SEND_MESSAGES_IN_THREADS",
            ),
            (Permissions::CONNECT, "CONNECT"),
            (Permissions::SPEAK, "SPEAK"),
            (Permissions::MUTE_MEMBERS, "MUTE_MEMBERS"),
            (Permissions::DEAFEN_MEMBERS, "DEAFEN_MEMBERS"),
            (Permissions::MOVE_MEMBERS, "MOVE_MEMBERS"),
            (Permissions::USE_VAD, "USE_VAD"),
            (Permissions::PRIORITY_SPEAKER, "PRIORITY_SPEAKER"),
            (Permissions::STREAM, "STREAM"),
            (Permissions::ADMINISTRATOR, "ADMINISTRATOR"),
        ];

        for (flag, name) in flags {
            if self.contains(flag) {
                result.push(name);
            }
        }
        result
    }
}

#[macro_export]
macro_rules! require_permission {
    ($context:expr, $permission:expr) => {
        if !$context.can($permission) {
            return Err("Insufficient permissions".into());
        }
    };
}

#[macro_export]
macro_rules! require_any_permission {
    ($context:expr, $($permission:expr),+) => {
        if !$context.can_any(&[$($permission),+]) {
            return Err("Insufficient permissions".into());
        }
    };
}

#[macro_export]
macro_rules! require_all_permissions {
    ($context:expr, $($permission:expr),+) => {
        if !$context.can_all(&[$($permission),+]) {
            return Err("Insufficient permissions".into());
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_permissions() {
        let perms = Permissions::SEND_MESSAGES | Permissions::VIEW_CHANNEL;
        assert!(perms.can(Permissions::SEND_MESSAGES));
        assert!(perms.can(Permissions::VIEW_CHANNEL));
        assert!(!perms.can(Permissions::MANAGE_MESSAGES));
    }

    #[test]
    fn test_administrator_override() {
        let perms = Permissions::ADMINISTRATOR;
        assert!(perms.can(Permissions::SEND_MESSAGES));
        assert!(perms.can(Permissions::MANAGE_GUILD));
        assert!(perms.can(Permissions::BAN_MEMBERS));
    }

    #[test]
    fn test_permission_overrides() {
        let base = Permissions::SEND_MESSAGES | Permissions::VIEW_CHANNEL;
        let overrides = PermissionOverrides::new()
            .deny(Permissions::SEND_MESSAGES)
            .allow(Permissions::MANAGE_MESSAGES);

        let result = overrides.apply_to(base);
        assert!(!result.contains(Permissions::SEND_MESSAGES));
        assert!(result.contains(Permissions::VIEW_CHANNEL));
        assert!(result.contains(Permissions::MANAGE_MESSAGES));
    }

    #[test]
    fn test_permission_groups() {
        let text_perms = Permissions::TEXT_PERMISSIONS;
        assert!(text_perms.contains(Permissions::SEND_MESSAGES));
        assert!(text_perms.contains(Permissions::VIEW_CHANNEL));
        assert!(!text_perms.contains(Permissions::CONNECT));

        let voice_perms = Permissions::VOICE_PERMISSIONS;
        assert!(voice_perms.contains(Permissions::CONNECT));
        assert!(voice_perms.contains(Permissions::SPEAK));
        assert!(!voice_perms.contains(Permissions::SEND_MESSAGES));
    }
}
