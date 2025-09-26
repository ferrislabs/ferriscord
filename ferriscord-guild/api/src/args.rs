use clap::Parser;

use crate::args::{database::DatabaseArgs, log::LogArgs};

pub mod database;
pub mod log;

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,

    #[command(flatten)]
    pub db: DatabaseArgs,
}
