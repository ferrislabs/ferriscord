use ferriscord_entities::{guild::GuildId, user::UserId};

use crate::domain::errors::CoreError;

pub trait MemberRepository: Send + Sync {
    fn insert(
        &self,
        guild_id: &GuildId,
        user_id: &UserId,
    ) -> impl Future<Output = Result<(), CoreError>> + Send;
}
