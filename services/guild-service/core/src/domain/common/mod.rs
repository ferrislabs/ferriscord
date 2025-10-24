use ferriscord_auth::AuthRepository;

use crate::domain::{guild::ports::GuildPort, role::ports::RoleRepository};

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
