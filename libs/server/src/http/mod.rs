use axum::{
    RequestPartsExt,
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

use ferriscord_auth::models::token::Token;
use ferriscord_error::ApiError;

pub mod response;

pub async fn extract_token_from_bearer(parts: &mut Parts) -> Result<Token, ApiError> {
    let TypedHeader(Authorization(bearer)) = parts
        .extract::<TypedHeader<Authorization<Bearer>>>()
        .await
        .map_err(|_| ApiError::TokenNotFound)?;

    Ok(Token(bearer.token().to_string()))
}
