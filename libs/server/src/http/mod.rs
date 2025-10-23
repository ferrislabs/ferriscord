use axum::{
    extract::{Request, State},
    http::{HeaderValue, StatusCode, header::AUTHORIZATION},
    middleware::Next,
    response::Response,
};
use tracing::{debug, error};

use ferriscord_auth::{AuthError, AuthRepository, HasAuthRepository, Token};
use ferriscord_error::ApiError;

pub mod response;

#[derive(Debug)]
pub enum MiddlewareError {
    MissingAuthHeader,
    InvalidAuthHeader,
    AuthenticationFailed(AuthError),
}

impl From<MiddlewareError> for StatusCode {
    fn from(error: MiddlewareError) -> Self {
        match error {
            MiddlewareError::MissingAuthHeader => StatusCode::UNAUTHORIZED,
            MiddlewareError::InvalidAuthHeader => StatusCode::UNAUTHORIZED,
            MiddlewareError::AuthenticationFailed(_) => StatusCode::UNAUTHORIZED,
        }
    }
}

pub async fn extract_token_from_bearer(auth_header: &HeaderValue) -> Result<Token, ApiError> {
    let auth_str = auth_header.to_str().map_err(|_| ApiError::TokenNotFound)?;

    if !auth_str.starts_with("Bearer ") {
        return Err(ApiError::TokenNotFound);
    }

    let token = auth_str
        .strip_prefix("Bearer ")
        .ok_or(ApiError::TokenNotFound)?;

    Ok(Token::new(token.to_string()))
}

pub async fn auth_middleware<T>(
    State(state): State<T>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode>
where
    T: HasAuthRepository + Clone + Send + Sync + 'static,
{
    let auth_header = req
        .headers()
        .get(AUTHORIZATION)
        .ok_or(MiddlewareError::MissingAuthHeader)?;

    let token = extract_token_from_bearer(auth_header)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let identity = state
        .auth_repository()
        .identify(token.as_str())
        .await
        .map_err(|e| {
            error!("Auth middleware: failed to identity user {:?}", e);
            MiddlewareError::AuthenticationFailed(e)
        })?;

    debug!(
        "Auth middleware: successfully identified user: {}",
        identity.id()
    );

    req.extensions_mut().insert(identity);

    Ok(next.run(req).await)
}
