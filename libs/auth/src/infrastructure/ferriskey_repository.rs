use std::sync::Arc;

use chrono::Utc;
use jsonwebtoken::{DecodingKey, Validation, decode, decode_header};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::warn;

use crate::{AuthError, AuthRepository, Claims, Identity};

#[derive(Debug, Serialize, Deserialize)]
pub struct Jwks {
    keys: Vec<Jwk>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Jwk {
    kid: String,
    n: String,
    e: String,
}

#[derive(Clone)]
pub struct FerriskeyAuthRepository {
    pub http: Arc<Client>,
    pub issuer: String,
    pub audience: Option<String>,
}

impl FerriskeyAuthRepository {
    pub fn new(issuer: impl Into<String>, audience: Option<String>) -> Self {
        Self {
            http: Arc::new(Client::new()),
            issuer: issuer.into(),
            audience,
        }
    }

    async fn fetch_jwks(&self) -> Result<Jwks, AuthError> {
        let url = format!("{}/protocol/openid-connect/certs", self.issuer);

        let resp = self.http.get(url).send().await.map_err(|e| {
            warn!("failed to fetch jwks: {}", e);
            AuthError::Network {
                message: e.to_string(),
            }
        })?;

        if resp.status().is_client_error() || resp.status().is_server_error() {
            warn!("failed to fetch jwks: {}", resp.status());
            return Err(AuthError::Network {
                message: format!("failed to fetch jwks: {}", resp.status()),
            });
        }

        let bytes = resp.bytes().await.map_err(|e| {
            warn!("failed to read jwks response body: {}", e);
            AuthError::Network {
                message: e.to_string(),
            }
        })?;

        let jwks: Jwks = serde_json::from_slice(&bytes).map_err(|e| AuthError::Network {
            message: e.to_string(),
        })?;

        Ok(jwks)
    }
}

impl AuthRepository for FerriskeyAuthRepository {
    async fn identify(&self, token: &str) -> Result<Identity, AuthError> {
        let claims = self.validate_token(token).await?;

        Ok(Identity::from(claims))
    }

    async fn validate_token(&self, token: &str) -> Result<Claims, AuthError> {
        let header = decode_header(token).map_err(|e| {
            warn!("failed to decode token header: {}", e);
            AuthError::InvalidToken {
                message: e.to_string(),
            }
        })?;

        let kid = header.kid.ok_or_else(|| {
            warn!("token is missing kid header");
            AuthError::InvalidToken {
                message: "missing kid".into(),
            }
        })?;

        let jwks = self.fetch_jwks().await?;

        let keys = jwks.keys;

        let key = keys
            .iter()
            .find(|k| k.kid == kid)
            .ok_or_else(|| AuthError::KeyNotFound { key: kid.clone() })?;

        let decoding_key = DecodingKey::from_rsa_components(&key.n, &key.e).map_err(|e| {
            warn!("failed to build decoding key from jwk: {}", e);
            AuthError::Internal {
                message: e.to_string(),
            }
        })?;

        let mut validation = Validation::new(jsonwebtoken::Algorithm::RS256);

        validation.validate_aud = false;
        validation.validate_exp = false;

        let data = decode::<Claims>(token, &decoding_key, &validation).map_err(|e| {
            warn!("failed to decode token: {}", e);
            AuthError::InvalidToken {
                message: e.to_string(),
            }
        })?;

        let claims = data.claims;

        let now = Utc::now().timestamp();

        if claims.exp.unwrap_or(0) < now {
            warn!("token is expired");
            return Err(AuthError::Expired);
        }

        Ok(claims)
    }
}
