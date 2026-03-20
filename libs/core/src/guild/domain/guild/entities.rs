use ferriscord_entities::{guild::OwnerId, user::UserId};

pub struct CreateGuildInput {
    pub name: String,
    pub owner_id: OwnerId,
    /// The owner's actual database UUID (users.id), used to insert them as a member.
    /// Distinct from owner_id which stores the oauth_sub.
    pub owner_user_id: UserId,
}
