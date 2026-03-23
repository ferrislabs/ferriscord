use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{Id, guild::GuildId};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::member::ports::MemberRepository;
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{presence::PresenceStatus, state::AppState};

#[derive(TypedPath, serde::Deserialize)]
#[typed_path("/guilds/{guild_id}/members")]
pub struct GetMembersRoute {
    guild_id: Uuid,
}

#[derive(Serialize, ToSchema, PartialEq)]
pub struct RoleSummaryResponse {
    pub id: Uuid,
    pub name: String,
    pub color: u32,
}

#[derive(Serialize, ToSchema, PartialEq)]
pub struct GuildMemberResponse {
    pub member_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub joined_at: chrono::DateTime<chrono::Utc>,
    pub status: PresenceStatus,
    pub roles: Vec<RoleSummaryResponse>,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/members",
    tag = "members",
    summary = "List guild members",
    params(("guild_id" = Uuid, Path, description = "Guild ID")),
    security(("Authorization" = ["Bearer"])),
    responses(
        (status = 200, body = Vec<GuildMemberResponse>),
        (status = 401, description = "Unauthorized", body = ApiError),
    )
)]
pub async fn get_members_handler(
    GetMembersRoute { guild_id }: GetMembersRoute,
    State(state): State<AppState>,
    Extension(_identity): Extension<Identity>,
) -> Result<Response<Vec<GuildMemberResponse>>, ApiError> {
    let members = state
        .member_repository
        .list_members(&GuildId(Id(guild_id)))
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    let user_ids: Vec<uuid::Uuid> = members.iter().map(|m| m.user_id).collect();
    let presences = state.presence.get_many(&user_ids).await;

    let response = members.into_iter().map(|m| {
        let status = presences.get(&m.user_id).cloned().unwrap_or_default();
        GuildMemberResponse {
            member_id: m.member_id,
            user_id: m.user_id,
            username: m.username,
            display_name: m.display_name,
            avatar_url: m.avatar_url,
            joined_at: m.joined_at,
            status,
            roles: m.roles.into_iter().map(|r| RoleSummaryResponse {
                id: r.id,
                name: r.name,
                color: r.color,
            }).collect(),
        }
    }).collect();

    Ok(Response::OK(response))
}
