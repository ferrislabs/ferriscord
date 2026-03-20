use ferriscord_entities::{guild::{Guild, GuildId}, invite::Invite, user::UserId};
use uuid::Uuid;

use crate::guild::domain::{
    errors::CoreError,
    guild::ports::GuildPort,
    invite::ports::{InviteRepository, InviteService},
    member::ports::MemberRepository,
};

#[derive(Clone)]
pub struct InviteServiceImpl<I, G, M>
where
    I: InviteRepository,
    G: GuildPort,
    M: MemberRepository,
{
    pub(crate) invite_repository: I,
    pub(crate) guild_repository: G,
    pub(crate) member_repository: M,
}

impl<I, G, M> InviteService for InviteServiceImpl<I, G, M>
where
    I: InviteRepository,
    G: GuildPort,
    M: MemberRepository,
{
    async fn create(
        &self,
        caller_sub: &str,
        guild_id: &GuildId,
        expires_in_hours: Option<u32>,
        max_uses: Option<u32>,
    ) -> Result<Invite, CoreError> {
        // Verify guild exists
        self.guild_repository
            .find_by_id(guild_id)
            .await?
            .ok_or_else(|| CoreError::GuildNotFound { guild_id: guild_id.clone() })?;

        self.invite_repository
            .insert(guild_id, caller_sub, expires_in_hours, max_uses)
            .await
    }

    async fn list(&self, guild_id: &GuildId) -> Result<Vec<Invite>, CoreError> {
        self.invite_repository.list_by_guild(guild_id).await
    }

    async fn delete(&self, invite_id: Uuid, guild_id: &GuildId) -> Result<(), CoreError> {
        self.invite_repository.delete(invite_id, guild_id).await
    }

    async fn join_by_code(
        &self,
        _caller_sub: &str,
        caller_user_id: &UserId,
        code: &str,
    ) -> Result<Guild, CoreError> {
        let invite = self
            .invite_repository
            .find_by_code(code)
            .await?
            .ok_or(CoreError::InviteNotFound)?;

        // Check expiry
        if let Some(expires_at) = invite.expires_at {
            if expires_at < chrono::Utc::now() {
                return Err(CoreError::InviteExpired);
            }
        }

        // Check max uses
        if let Some(max) = invite.max_uses {
            if invite.uses >= max {
                return Err(CoreError::InviteMaxUsesReached);
            }
        }

        let guild = self
            .guild_repository
            .find_by_id(&invite.guild_id)
            .await?
            .ok_or_else(|| CoreError::GuildNotFound { guild_id: invite.guild_id.clone() })?;

        // Add member (ignore duplicate)
        let _ = self.member_repository.insert(&guild.id, caller_user_id).await;

        // Increment uses
        self.invite_repository.increment_uses(invite.id).await?;

        Ok(guild)
    }

    async fn preview_by_code(&self, code: &str) -> Result<(Invite, Guild), CoreError> {
        let invite = self
            .invite_repository
            .find_by_code(code)
            .await?
            .ok_or(CoreError::InviteNotFound)?;

        let guild = self
            .guild_repository
            .find_by_id(&invite.guild_id)
            .await?
            .ok_or_else(|| CoreError::GuildNotFound { guild_id: invite.guild_id.clone() })?;

        Ok((invite, guild))
    }
}
