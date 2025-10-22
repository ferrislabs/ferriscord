use std::sync::Arc;

use chrono::Utc;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use reqwest::Client;

use crate::domain::{
    models::{claims::Claims, errors::AuthError, identity::Identity},
    ports::AuthRepository,
};

#[derive(Clone)]
pub struct KeycloakAuthRepository {
    pub http: Arc<Client>,
    pub issuer: String,
    pub audience: Option<String>,
}

impl KeycloakAuthRepository {
    pub fn new(issuer: impl Into<String>, audience: Option<String>) -> Self {
        Self {
            http: Arc::new(Client::new()),
            issuer: issuer.into(),
            audience,
        }
    }

    async fn fetch_jwks(&self) -> Result<serde_json::Value, AuthError> {
        let url = format!("{}/protocol/openid-connect/certs", self.issuer);
        let resp = self
            .http
            .get(url)
            .send()
            .await
            .map_err(|e| AuthError::Network {
                message: e.to_string(),
            })?;

        let jwks: serde_json::Value = resp.json().await.map_err(|e| AuthError::Network {
            message: e.to_string(),
        })?;

        Ok(jwks)
    }
}

impl AuthRepository for KeycloakAuthRepository {
    async fn validate_token(
        &self,
        token: &str,
    ) -> Result<crate::domain::models::claims::Claims, AuthError> {
        let header = decode_header(token).map_err(|e| AuthError::InvalidToken {
            message: e.to_string(),
        })?;

        let kid = header.kid.ok_or_else(|| AuthError::InvalidToken {
            message: "missing kind".into(),
        })?;

        let jwks = self.fetch_jwks().await?;

        let keys =
            jwks.get("keys")
                .and_then(|v| v.as_array())
                .ok_or_else(|| AuthError::Internal {
                    message: "invalid jwks".into(),
                })?;

        let key = keys
            .iter()
            .find(|k| k.get("id").and_then(|v| v.as_str()) == Some(&kid))
            .ok_or_else(|| AuthError::KeyNotFound { key: kid.clone() })?;

        let n = key
            .get("n")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::Internal {
                message: "missing n".into(),
            })?;

        let e = key
            .get("e")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AuthError::Internal {
                message: "missing e".into(),
            })?;
        let decoding_key =
            DecodingKey::from_rsa_components(n, e).map_err(|e| AuthError::Internal {
                message: e.to_string(),
            })?;

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[&self.issuer]);
        if let Some(aud) = &self.audience {
            validation.set_audience(&[aud]);
        }

        let data = decode::<Claims>(token, &decoding_key, &validation).map_err(|e| {
            AuthError::InvalidToken {
                message: e.to_string(),
            }
        })?;

        let claims = data.claims;

        let now = Utc::now().timestamp();

        if claims.exp.unwrap_or(0) < now {
            return Err(AuthError::Expired);
        }

        Ok(claims)
    }

    async fn identify(
        &self,
        token: &str,
    ) -> Result<crate::domain::models::identity::Identity, AuthError> {
        let claims = self.validate_token(token).await?;

        Ok(Identity::from(claims))
    }
}
