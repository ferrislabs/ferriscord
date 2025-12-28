use ferriscord_config::{AuthConfig, DatabaseConfig};

pub mod common;
pub mod user;

pub struct Config {
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
}
