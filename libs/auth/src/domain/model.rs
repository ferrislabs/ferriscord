use serde::{Deserialize, Serialize};

use crate::domain::{client::Client, identity::Identity, user::User};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Subject(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Role(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Scope(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Subject,
    pub iss: String,
    pub aud: Option<String>,

    pub email: Option<String>,
    pub email_verified: bool,
    pub name: Option<String>,
    pub preferred_username: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub scope: String,

    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

impl From<Claims> for Identity {
    fn from(c: Claims) -> Self {
        let has_email = c.email.is_some();

        let username = c
            .extra
            .get("preferred_username")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        let client_id = c
            .extra
            .get("client_id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let is_service_account = username.starts_with("service-account-") || client_id.is_some();

        if is_service_account {
            Identity::Client(Client {
                id: c.sub.0.clone(),
                client_id: client_id.unwrap_or_else(|| username.clone()),
                roles: Vec::new(),
                scopes: Vec::new(),
            })
        } else {
            Identity::User(User {
                id: c.sub.0.clone(),
                username,
                email: c.email.clone(),
                name: c
                    .extra
                    .get("name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                roles: Vec::new(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::domain::model::{Claims, Role, Scope, Subject};

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
}
