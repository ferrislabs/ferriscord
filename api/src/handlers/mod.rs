use axum::{
    Router,
    extract::{Request, State},
    http::{StatusCode, header::AUTHORIZATION},
    middleware::{self, Next},
    response::Response,
};
use ferriscord_auth::AuthRepository;
use ferriscord_core::{
    crypto::domain::ports::CryptoError,
    guild::domain::errors::CoreError,
};
use ferriscord_core::user::domain::user::ports::UserService;
use ferriscord_error::ApiError;
use ferriscord_server::http::extract_token_from_bearer;
use tracing::error;

pub mod crypto;
pub mod dm;
pub mod guild;
pub mod user;

pub(crate) fn map_core_error(error: CoreError) -> ApiError {
    match error {
        CoreError::InsufficientPermissions => ApiError::Forbidden {
            message: error.to_string(),
        },
        _ => ApiError::Unknown {
            message: error.to_string(),
        },
    }
}

pub(crate) fn map_crypto_error(error: CryptoError) -> ApiError {
    match error {
        CryptoError::NotFound => ApiError::NotFound {
            message: "not found".into(),
        },
        CryptoError::AlreadyExists => ApiError::BadRequest {
            message: "already exists".into(),
        },
        CryptoError::NoPreKeysAvailable => ApiError::NotFound {
            message: "no pre-keys available".into(),
        },
        CryptoError::Internal { message } => ApiError::Unknown { message },
    }
}

async fn service_auth_middleware(
    State(state): State<crate::state::AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(AUTHORIZATION)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = extract_token_from_bearer(auth_header)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let identity = state.auth.identify(token.as_str()).await.map_err(|e| {
        error!("Auth middleware: failed to identify user: {:?}", e);
        StatusCode::UNAUTHORIZED
    })?;

    // Upsert the user in the ferriscord DB on every authenticated request
    if identity.is_user() {
        if let Err(e) = state
            .user_service
            .upsert_by_sub(identity.id(), identity.username())
            .await
        {
            error!("Auth middleware: failed to upsert user: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }

    req.extensions_mut().insert(identity);

    Ok(next.run(req).await)
}

pub fn handlers_routes(state: crate::state::AppState) -> Router<crate::state::AppState> {
    Router::new()
        .merge(guild::guild_routes(state.clone()))
        .merge(user::user_routes(state.clone()))
        .merge(dm::dm_routes(state.clone()))
        .merge(crypto::crypto_routes(state.clone()))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            service_auth_middleware,
        ))
}
