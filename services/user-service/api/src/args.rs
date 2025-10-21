use clap::Parser;
use ferriscord_server::ServerTls;
use user_core::{Config, DatabaseConfig};

use crate::args::{
    database::DatabaseArgs,
    log::LogArgs,
    server::{ServerArgs, ServerTlsArgs},
};

pub mod database;
pub mod log;
pub mod server;

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,

    #[command(flatten)]
    pub database: DatabaseArgs,

    #[command(flatten)]
    pub server: ServerArgs,
}

impl From<DatabaseArgs> for DatabaseConfig {
    fn from(value: DatabaseArgs) -> Self {
        Self {
            dbname: value.name,
            host: value.host,
            password: value.password,
            port: value.port,
            user: value.user,
        }
    }
}

impl From<ServerTlsArgs> for ServerTls {
    fn from(value: ServerTlsArgs) -> Self {
        ServerTls {
            cert: value.cert,
            key: value.key,
        }
    }
}

impl From<Args> for Config {
    fn from(value: Args) -> Self {
        Self {
            database: value.database.into(),
        }
    }
}
