use ferriscord_entities::{Id, guild::GuildId, member::MemberId, user::UserId};
use sqlx::PgPool;

use crate::guild::domain::{errors::CoreError, member::ports::MemberRepository};

#[derive(Clone)]
pub struct PostgresMemberRepository {
    pool: PgPool,
}

impl PostgresMemberRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl MemberRepository for PostgresMemberRepository {
    async fn insert(&self, guild_id: &GuildId, user_id: &UserId) -> Result<(), CoreError> {
        let member_id = MemberId(Id::new());

        sqlx::query!(
            r#"
            INSERT INTO members (id, guild_id, user_id)
            VALUES ($1, $2, $3)
            "#,
            member_id.get_uuid(),
            guild_id.get_uuid(),
            user_id.get_uuid(),
        )
        .execute(&self.pool)
        .await
        .map_err(|e| CoreError::Unknown {
            message: format!("failed to insert member: {}", e),
        })?;

        Ok(())
    }
}
