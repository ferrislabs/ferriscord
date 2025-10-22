use crate::domain::models::{claims::Claims, errors::AuthError};

pub trait TokenDecoder {
    fn decode_unverified(&self, token: &str) -> Result<Claims, AuthError>;
}
