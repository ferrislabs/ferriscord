use crate::domain::{
    models::{claims::Claims, errors::AuthError},
    ports::TokenDecoder,
};
use jsonwebtoken::dangerous::insecure_decode;
pub struct JwtDecoder;

impl JwtDecoder {
    pub fn new() -> Self {
        Self {}
    }
}

impl TokenDecoder for JwtDecoder {
    fn decode_unverified(&self, token: &str) -> Result<Claims, AuthError> {
        let data =
            insecure_decode::<serde_json::Value>(token).map_err(|e| AuthError::InvalidToken {
                message: e.to_string(),
            })?;

        let claims_value: serde_json::Value = data.claims;

        let claims: Claims =
            serde_json::from_value(claims_value).map_err(|e| AuthError::InvalidToken {
                message: e.to_string(),
            })?;

        Ok(claims)
    }
}

#[cfg(test)]
mod tests {
    use jsonwebtoken::{EncodingKey, Header, encode};
    use serde_json::json;

    use crate::{domain::ports::TokenDecoder, infrastructure::jwt_decoder::JwtDecoder};

    fn create_test_jwt(claims: serde_json::Value) -> String {
        let header = Header::default();
        let key = EncodingKey::from_secret("secret".as_ref());
        encode(&header, &claims, &key).unwrap()
    }

    #[test]
    fn test_decode_unverified_valid_jwt() {
        let decoder = JwtDecoder::new();

        let test_claims = json!({
            "sub": "user-123",
            "iss": "https://auth.ferriscord.com",
            "aud": "ferriscord-api",
            "exp": 1735689600,
            "iat": 1735603200,
            "email": "john.doe@example.com",
            "email_verified": true,
            "roles": ["user", "moderator"],
            "scope": "read:messages, write:messages",
            "preferred_username": "johndoe",
            "name": "John Doe"
        });

        let jwt_token = create_test_jwt(test_claims);
        let result = decoder.decode_unverified(&jwt_token);

        assert!(result.is_ok());
        let claims = result.unwrap();
        assert_eq!(claims.sub.0, "user-123");
        assert_eq!(claims.iss, "https://auth.ferriscord.com");
        assert_eq!(claims.aud, Some("ferriscord-api".to_string()));
        assert_eq!(claims.email, Some("john.doe@example.com".to_string()));
    }

    #[test]
    fn test_decode_unverified_with_token() {
        let decoder = JwtDecoder::new();

        let token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiaE9ZRENETC14TFhyWVRGdERTMmlwMzdHdHhFNlpUVVI4a2swSm9CVDhzIn0.eyJleHAiOjE3NjExMTc5NTYsImlhdCI6MTc2MTExNzg5NiwianRpIjoib25ydHJvOjJhMjNjYjkyLTc1MTktYzgzYS0wMGM2LWIxNDQyOTlkYjE1NSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjE0NDM0Y2JhLThmMzItNDliYi1hMzllLTgzNzhhN2NkZGVhMyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFwaSIsInNpZCI6ImY2YjUwZWY2LTJlNjItNjAxNS1lNTJjLTA5NzA4NWUyYTAxOCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiTmF0aGFlbCBCb25uYWwiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJuYXRoYWVsIiwiZ2l2ZW5fbmFtZSI6Ik5hdGhhZWwiLCJmYW1pbHlfbmFtZSI6IkJvbm5hbCIsImVtYWlsIjoibmF0aGFlbEBib25uYWwuY2xvdWQifQ.ApKQsnjT2gCgqngCndHTNU2W9YJzuHGHRLk4OE-_b4Sk650vSUS0AhMWPuAgEwVjLm2y8UpOJ_64BXDcnQMZzKHNo2_xj5c8P8glvBM-02YJlR_ssbUlReJPvLLKzwFTPdKF_FDsEIXkroV-ds8aU5OmOX8emdxb79XzdHkaWbl13IErHqMnRMsAvh742ZQeCqbedr8R3uH6V5qbbNu7H9kTf2EGX7G66rfpY-Zl8EyR4fWCVwjVLr_5tLsUFteajADf2RtW9dZRsUW9M9g9WIzT_tNdsTQhBj1q3kHkwhhC6hVVz4VaLNgYKikLu8QDfGy4BZ6nHZobrq4eKr3HQg";

        let result = decoder.decode_unverified(token);

        assert!(result.is_ok());
        let claims = result.unwrap();

        assert_eq!(claims.sub.0, "14434cba-8f32-49bb-a39e-8378a7cddea3");

        assert_eq!(claims.email, Some("nathael@bonnal.cloud".to_string()));
    }
}
