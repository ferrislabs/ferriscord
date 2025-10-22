use clap::Parser;
use ferriscord_server::args::{auth::AuthArgs, database::DatabaseArgs, log::LogArgs};

use guild_core::domain::Config;

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,

    #[command(flatten)]
    pub db: DatabaseArgs,

    #[command(flatten)]
    pub auth: AuthArgs,
}

impl From<Args> for Config {
    fn from(value: Args) -> Self {
        Self {
            database: value.db.into(),
            auth: value.auth.into(),
        }
    }
}
