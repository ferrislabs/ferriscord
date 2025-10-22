use axum::extract::{FromRef, FromRequestParts};
use base64::{Engine, engine::general_purpose};
use ferriscord_auth::models::claims::{Claims, Jwt};
use ferriscord_error::ApiError;
use ferriscord_server::http::extract_token_from_bearer;

use crate::state::AppState;
use tracing::error;

impl<S> FromRequestParts<S> for Jwt
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let token = extract_token_from_bearer(parts).await?;
        let jwt = token.decode_manual().map_err(|e| ApiError::InvalidToken {
            message: e.to_string(),
        })?;

        Ok(jwt)
    }
}
