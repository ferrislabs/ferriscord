use crate::domain::models::{claims::Claims, errors::AuthError, identity::Identity};

pub trait AuthRepository: Send + Sync {
    fn validate_token(&self, token: &str)
    -> impl Future<Output = Result<Claims, AuthError>> + Send;

    fn identify(&self, token: &str) -> impl Future<Output = Result<Identity, AuthError>> + Send;
}
