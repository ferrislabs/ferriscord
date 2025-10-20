use crate::domain::guild::ports::GuildPort;

pub struct Service<G>
where
    G: GuildPort,
{
    pub(crate) guild_repository: G,
}
