use std::sync::Arc;

use clap::Parser;
use ferriscord_error::ApiError;
use tracing_subscriber::EnvFilter;

use crate::args::{Args, log::LogArgs};

mod args;
mod handlers;
mod state;

fn init_logger(args: &LogArgs) {
    let filter = EnvFilter::try_new(&args.filter).unwrap_or_else(|err| {
        eprint!("invalid log filter: {err}");
        eprint!("using default log filter: info");
        EnvFilter::new("info")
    });
    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr);
    if args.json {
        subscriber.json().init();
    } else {
        subscriber.init();
    }
}

#[tokio::main]
async fn main() -> Result<(), ApiError> {
    dotenv::dotenv().ok();

    let args = Arc::new(Args::parse());
    init_logger(&args.log);

    tracing::info!("Hello, world!");

    Ok(())
}
