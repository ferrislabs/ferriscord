use ferriscord_auth::AuthRepository;

use crate::domain::guild::ports::GuildPort;

#[derive(Clone)]
pub struct Service<G, A>
where
    G: GuildPort,
    A: AuthRepository,
{
    pub(crate) guild_repository: G,
    pub auth_repository: A,
}
