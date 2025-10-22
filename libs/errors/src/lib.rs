use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("unknown error: {message}")]
    Unknown { message: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ApiErrorResponse {
    pub code: String,
    pub status: u16,
    pub message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        match self {
            ApiError::Unknown { message } => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiErrorResponse {
                    code: "E_INTERNAL_SERVER_ERROR".to_string(),
                    status: 500,
                    message: format!("internal server error: {message}"),
                }),
            )
                .into_response(),
        }
    }
}
