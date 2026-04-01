use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use thiserror::Error;
use utoipa::ToSchema;

#[derive(Debug, Error, ToSchema)]
pub enum ApiError {
    #[error("unknown error: {message}")]
    Unknown { message: String },

    #[error("forbidden: {message}")]
    Forbidden { message: String },

    #[error("token not found")]
    TokenNotFound,

    #[error("invalid token: {message}")]
    InvalidToken { message: String },

    #[error("not found: {message}")]
    NotFound { message: String },

    #[error("bad request: {message}")]
    BadRequest { message: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, ToSchema)]
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

            ApiError::Forbidden { message } => (
                StatusCode::FORBIDDEN,
                Json(ApiErrorResponse {
                    code: "E_FORBIDDEN".to_string(),
                    status: 403,
                    message,
                }),
            )
                .into_response(),

            ApiError::TokenNotFound => (
                StatusCode::UNAUTHORIZED,
                Json(ApiErrorResponse {
                    code: "E_UNAUTHORIZED".to_string(),
                    status: 401,
                    message: "token not found".to_string(),
                }),
            )
                .into_response(),

            ApiError::InvalidToken { message } => (
                StatusCode::UNAUTHORIZED,
                Json(ApiErrorResponse {
                    code: "E_UNAUTHORIZED".to_string(),
                    status: 401,
                    message,
                }),
            )
                .into_response(),

            ApiError::NotFound { message } => (
                StatusCode::NOT_FOUND,
                Json(ApiErrorResponse {
                    code: "E_NOT_FOUND".to_string(),
                    status: 404,
                    message,
                }),
            )
                .into_response(),

            ApiError::BadRequest { message } => (
                StatusCode::BAD_REQUEST,
                Json(ApiErrorResponse {
                    code: "E_BAD_REQUEST".to_string(),
                    status: 400,
                    message,
                }),
            )
                .into_response(),
        }
    }
}
