use ferriscord_entities::guild::OwnerId;

pub struct CreateGuildInput {
    pub name: String,
    pub owner_id: OwnerId,
}
