use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Role(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Scope(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Subject(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Subject,
    pub iss: String,
    pub aud: Option<String>,
    pub exp: Option<i64>,

    pub email: Option<String>,
    pub email_verified: bool,
    pub name: Option<String>,
    pub preferred_username: String,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub scope: String,
    pub client_id: Option<String>,

    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use crate::domain::models::claims::{Claims, Role, Scope, Subject};

    #[test]
    fn test_subject_deserialize_from_json() {
        let json = r#""user-123""#;
        let subject: Subject = serde_json::from_str(json).unwrap();

        assert_eq!(subject.0, "user-123");
    }

    #[test]
    fn test_role_deserialize_from_json() {
        let json = r#""admin""#;
        let role: Role = serde_json::from_str(json).unwrap();
        assert_eq!(role.0, "admin");
    }

    #[test]
    fn test_scope_deserialize_from_json() {
        let json = r#""read:users""#;
        let scope: Scope = serde_json::from_str(json).unwrap();
        assert_eq!(scope.0, "read:users");
    }

    #[test]
    fn test_claims_deserialize_basic() {
        let json = r#"{
            "exp": 1761117956,
            "iat": 1761117896,
            "jti": "onrtro:2a23cb92-7519-c83a-00c6-b144299db155",
            "iss": "http://localhost:8000/realms/master",
            "aud": "account",
            "sub": "14434cba-8f32-49bb-a39e-8378a7cddea3",
            "typ": "Bearer",
            "azp": "api",
            "sid": "f6b50ef6-2e62-6015-e52c-097085e2a018",
            "acr": "1",
            "allowed-origins": [
              "/*"
            ],
            "realm_access": {
              "roles": [
                "default-roles-master",
                "offline_access",
                "uma_authorization"
              ]
            },
            "resource_access": {
              "account": {
                "roles": [
                  "manage-account",
                  "manage-account-links",
                  "view-profile"
                ]
              }
            },
            "scope": "profile email",
            "email_verified": true,
            "name": "Nathael Bonnal",
            "preferred_username": "nathael",
            "given_name": "Nathael",
            "family_name": "Bonnal",
            "email": "nathael@bonnal.cloud"
        }"#;

        let claims: Claims = serde_json::from_str(json).unwrap();

        assert_eq!(claims.sub.0, "14434cba-8f32-49bb-a39e-8378a7cddea3");
        assert_eq!(claims.iss, "http://localhost:8000/realms/master");
    }

    #[test]
    fn test_claims_with_extra_fields() {
        let json = r#"{
            "sub": "user-456",
            "iss": "https://auth.ferriscord.com",
            "exp": 1735689600,
            "email": null,
            "scope": "openid connect",
            "preferred_username": "johndoe",
            "email_verified": true,
            "name": "John Doe",
            "custom_field": "custom_value",
            "nested": {
                "data": "test"
            }
        }"#;

        let claims: Claims = serde_json::from_str(json).unwrap();

        assert_eq!(claims.sub.0, "user-456");
        assert_eq!(claims.email, None);

        assert_eq!(
            claims.extra.get("custom_field").unwrap().as_str().unwrap(),
            "custom_value"
        );
        assert!(claims.extra.contains_key("nested"));
    }
}
