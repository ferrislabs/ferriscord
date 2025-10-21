pub mod common;
pub mod user;

pub struct Config {
    pub database: DatabaseConfig,
}

pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub dbname: String,
}
