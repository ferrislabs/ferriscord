use axum::extract::{Extension, Json, State};
use axum_extra::routing::TypedPath;
use ferriscord_auth::Identity;
use ferriscord_core::user::domain::dm::ports::{
    DmHistorySyncJob, DmHistorySyncPayloadInput, DmHistorySyncStatus, DmService,
};
use ferriscord_entities::{
    crypto::{
        CreateDmHistorySyncJobRequest, DmHistorySyncJobInfo,
        FailDmHistorySyncJobRequest, UploadDmHistorySyncPayloadsRequest,
        UploadDmHistorySyncPayloadsResponse,
    },
    message::Message,
};
use ferriscord_error::ApiError;
use ferriscord_server::http::response::Response;
use serde::Deserialize;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::state::AppState;

fn map_job(job: DmHistorySyncJob) -> DmHistorySyncJobInfo {
    DmHistorySyncJobInfo {
        id: job.id,
        owner_user_id: job.owner_user_id,
        source_device_id: job.source_device_id,
        target_device_id: job.target_device_id,
        channel_id: job.channel_id,
        status: match job.status {
            DmHistorySyncStatus::Pending => ferriscord_entities::crypto::DmHistorySyncStatus::Pending,
            DmHistorySyncStatus::InProgress => ferriscord_entities::crypto::DmHistorySyncStatus::InProgress,
            DmHistorySyncStatus::Completed => ferriscord_entities::crypto::DmHistorySyncStatus::Completed,
            DmHistorySyncStatus::Failed => ferriscord_entities::crypto::DmHistorySyncStatus::Failed,
        },
        cursor_message_id: job.cursor_message_id,
        last_error: job.last_error,
        created_at: job.created_at,
        updated_at: job.updated_at,
    }
}

#[derive(TypedPath)]
#[typed_path("/dm/history-sync/jobs")]
pub struct CreateDmHistorySyncJobRoute;

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/history-sync/jobs/{job_id}")]
pub struct DmHistorySyncJobRoute {
    job_id: Uuid,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/history-sync/jobs/{job_id}/messages")]
pub struct DmHistorySyncMessagesRoute {
    job_id: Uuid,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/history-sync/jobs/{job_id}/payloads")]
pub struct DmHistorySyncPayloadsRoute {
    job_id: Uuid,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/history-sync/jobs/{job_id}/complete")]
pub struct CompleteDmHistorySyncJobRoute {
    job_id: Uuid,
}

#[derive(TypedPath, Deserialize)]
#[typed_path("/dm/history-sync/jobs/{job_id}/fail")]
pub struct FailDmHistorySyncJobRoute {
    job_id: Uuid,
}

#[derive(Debug, Deserialize, IntoParams)]
pub struct DmHistorySyncMessagesQuery {
    pub before: Option<Uuid>,
    pub limit: Option<u32>,
}

#[utoipa::path(
    post,
    path = "/dm/history-sync/jobs",
    tag = "dms",
    summary = "Create a DM history sync job for a newly linked device",
    security(("Authorization" = ["Bearer"])),
    request_body = CreateDmHistorySyncJobRequest,
    responses(
        (status = 201, body = DmHistorySyncJobInfo),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn create_dm_history_sync_job_handler(
    _: CreateDmHistorySyncJobRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<CreateDmHistorySyncJobRequest>,
) -> Result<Response<DmHistorySyncJobInfo>, ApiError> {
    let job = state
        .dm_service
        .create_history_sync_job(
            identity.id(),
            body.source_device_id,
            body.target_device_id,
            body.channel_id,
        )
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::Created(map_job(job)))
}

#[utoipa::path(
    get,
    path = "/dm/history-sync/jobs/{job_id}",
    tag = "dms",
    summary = "Get DM history sync job status",
    security(("Authorization" = ["Bearer"])),
    params(("job_id" = Uuid, Path, description = "History sync job ID")),
    responses(
        (status = 200, body = DmHistorySyncJobInfo),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn get_dm_history_sync_job_handler(
    DmHistorySyncJobRoute { job_id }: DmHistorySyncJobRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DmHistorySyncJobInfo>, ApiError> {
    let job = state
        .dm_service
        .get_history_sync_job(identity.id(), job_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(map_job(job)))
}

#[utoipa::path(
    get,
    path = "/dm/history-sync/jobs/{job_id}/messages",
    tag = "dms",
    summary = "List DM messages that still need history sync payloads",
    security(("Authorization" = ["Bearer"])),
    params(
        ("job_id" = Uuid, Path, description = "History sync job ID"),
        DmHistorySyncMessagesQuery,
    ),
    responses(
        (status = 200, body = Vec<Message>),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn list_dm_history_sync_messages_handler(
    DmHistorySyncMessagesRoute { job_id }: DmHistorySyncMessagesRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    axum::extract::Query(query): axum::extract::Query<DmHistorySyncMessagesQuery>,
) -> Result<Response<Vec<Message>>, ApiError> {
    let messages = state
        .dm_service
        .list_history_sync_messages(
            identity.id(),
            job_id,
            query.before,
            query.limit.unwrap_or(100),
        )
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(messages))
}

#[utoipa::path(
    post,
    path = "/dm/history-sync/jobs/{job_id}/payloads",
    tag = "dms",
    summary = "Upload re-encrypted history payloads for a target device",
    security(("Authorization" = ["Bearer"])),
    params(("job_id" = Uuid, Path, description = "History sync job ID")),
    request_body = UploadDmHistorySyncPayloadsRequest,
    responses(
        (status = 200, body = UploadDmHistorySyncPayloadsResponse),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn upload_dm_history_sync_payloads_handler(
    DmHistorySyncPayloadsRoute { job_id }: DmHistorySyncPayloadsRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<UploadDmHistorySyncPayloadsRequest>,
) -> Result<Response<UploadDmHistorySyncPayloadsResponse>, ApiError> {
    let uploaded = state
        .dm_service
        .upload_history_sync_payloads(
            identity.id(),
            job_id,
            body.payloads
                .into_iter()
                .map(|payload| DmHistorySyncPayloadInput {
                    message_id: payload.message_id,
                    ciphertext: payload.ciphertext,
                })
                .collect(),
        )
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(UploadDmHistorySyncPayloadsResponse { uploaded }))
}

#[utoipa::path(
    put,
    path = "/dm/history-sync/jobs/{job_id}/complete",
    tag = "dms",
    summary = "Mark a DM history sync job as completed",
    security(("Authorization" = ["Bearer"])),
    params(("job_id" = Uuid, Path, description = "History sync job ID")),
    responses(
        (status = 200, body = DmHistorySyncJobInfo),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn complete_dm_history_sync_job_handler(
    CompleteDmHistorySyncJobRoute { job_id }: CompleteDmHistorySyncJobRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<Response<DmHistorySyncJobInfo>, ApiError> {
    let job = state
        .dm_service
        .complete_history_sync_job(identity.id(), job_id)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(map_job(job)))
}

#[utoipa::path(
    put,
    path = "/dm/history-sync/jobs/{job_id}/fail",
    tag = "dms",
    summary = "Mark a DM history sync job as failed",
    security(("Authorization" = ["Bearer"])),
    params(("job_id" = Uuid, Path, description = "History sync job ID")),
    request_body = FailDmHistorySyncJobRequest,
    responses(
        (status = 200, body = DmHistorySyncJobInfo),
        (status = 401, body = ApiError),
        (status = 404, body = ApiError),
    )
)]
pub async fn fail_dm_history_sync_job_handler(
    FailDmHistorySyncJobRoute { job_id }: FailDmHistorySyncJobRoute,
    State(state): State<AppState>,
    Extension(identity): Extension<Identity>,
    Json(body): Json<FailDmHistorySyncJobRequest>,
) -> Result<Response<DmHistorySyncJobInfo>, ApiError> {
    let job = state
        .dm_service
        .fail_history_sync_job(identity.id(), job_id, body.error_message)
        .await
        .map_err(|e| ApiError::Unknown { message: e.to_string() })?;

    Ok(Response::OK(map_job(job)))
}
