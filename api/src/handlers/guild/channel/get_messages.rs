use axum::{Extension, extract::State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_entities::{
    Id,
    channel::ChannelId,
    guild::GuildId,
    message::{Message, MessageId},
};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use ferriscord_core::guild::domain::message::ports::MessageService;
use serde::Deserialize;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::state::AppState;

#[derive(TypedPath, Deserialize)]
#[typed_path("/guilds/{guild_id}/channels/{channel_id}/messages")]
pub struct GetMessagesRoute {
    guild_id: Uuid,
    channel_id: Uuid,
}

#[derive(Debug, Deserialize, IntoParams)]
pub struct GetMessagesQuery {
    /// Return messages before this message ID (for pagination)
    pub before: Option<Uuid>,
    /// Maximum number of messages to return (default 50, max 100)
    pub limit: Option<u32>,
}

#[utoipa::path(
    get,
    path = "/guilds/{guild_id}/channels/{channel_id}/messages",
    tag = "messages",
    summary = "List channel messages",
    description = "Returns messages in a text channel, newest-first with cursor pagination.",
    params(
        ("guild_id" = Uuid, Path, description = "Guild ID"),
        ("channel_id" = Uuid, Path, description = "Channel ID"),
        GetMessagesQuery,
    ),
    security(
        ("Authorization" = ["Bearer"]),
    ),
    responses(
        (status = 200, description = "List of messages", body = Vec<Message>),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 403, description = "Missing VIEW_CHANNEL permission", body = ApiError),
        (status = 404, description = "Guild or channel not found", body = ApiError),
        (status = 500, description = "Internal server error", body = ApiError),
    )
)]
pub async fn get_messages_handler(
    GetMessagesRoute { guild_id, channel_id }: GetMessagesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    axum::extract::Query(query): axum::extract::Query<GetMessagesQuery>,
) -> Result<Response<Vec<Message>>, ApiError> {
    let guild_id = GuildId(Id(guild_id));
    let channel_id = ChannelId(Id(channel_id));
    let before = query.before.map(|id| MessageId(Id(id)));
    let limit = query.limit.unwrap_or(50);

    let messages = state
        .guild_service
        .get_channel_messages(identity, guild_id, channel_id, before, limit)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    Ok(Response::OK(messages))
}
