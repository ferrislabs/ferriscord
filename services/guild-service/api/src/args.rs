use crate::args::{database::DatabaseArgs, log::LogArgs};
use clap::Parser;
use guild_core::domain::{Config, DatabaseConfig};

pub mod database;
pub mod log;

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,

    #[command(flatten)]
    pub db: DatabaseArgs,
}

impl From<Args> for Config {
    fn from(value: Args) -> Self {
        Self {
            database: DatabaseConfig {
                dbname: value.db.name,
                host: value.db.host,
                password: value.db.password,
                port: value.db.port,
                user: value.db.user,
            },
        }
    }
}
