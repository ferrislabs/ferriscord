pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub dbname: String,
}

pub struct AuthConfig {
    pub issuer: String,
    pub client_id: String,
    pub client_secret: String,
}
