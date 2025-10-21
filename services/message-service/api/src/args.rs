use clap::Parser;

use crate::args::log::LogArgs;

mod database;
mod log;

#[derive(Debug, Clone, Parser)]
pub struct Args {
    #[command(flatten)]
    pub log: LogArgs,
}
