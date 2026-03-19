use clap::Parser;
use ferriscord_server::args::{
    ServerArgs, auth::AuthArgs, database::DatabaseArgs, log::LogArgs, storage::StorageArgs,
};

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,

    #[command(flatten)]
    pub db: DatabaseArgs,

    #[command(flatten)]
    pub auth: AuthArgs,

    #[command(flatten)]
    pub server: ServerArgs,

    #[command(flatten)]
    pub storage: StorageArgs,
}
