use ferriscord_config::AuthConfig;

#[derive(clap::Args, Debug, Clone)]
pub struct AuthArgs {
    #[arg(
        long = "auth-issuer",
        env = "AUTH_ISSUER",
        default_value = "http://localhost:8080/realms/ferriscord",
        name = "AUTH_ISSUER",
        long_help = "The issuer of the IAM"
    )]
    pub issuer: String,

    #[arg(
        long = "auth-client-id",
        env = "AUTH_CLIENT_ID",
        default_value = "client-id",
        name = "AUTH_CLIENT_ID",
        long_help = "The client id of service account"
    )]
    pub client_id: String,

    #[arg(
        long = "auth-client-secret",
        env = "AUTH_CLIENT_SECRET",
        default_value = "client-secret",
        name = "AUTH_CLIENT_SECRET",
        long_help = "The client secret of service account"
    )]
    pub client_secret: String,
}

impl Default for AuthArgs {
    fn default() -> Self {
        Self {
            issuer: "http://localhost:8080/realms/ferriscord".to_string(),
            client_id: "client_id".to_string(),
            client_secret: "client_secret".to_string(),
        }
    }
}

impl From<AuthArgs> for AuthConfig {
    fn from(value: AuthArgs) -> Self {
        Self {
            issuer: value.issuer,
            client_id: value.client_id,
            client_secret: value.client_secret,
        }
    }
}
