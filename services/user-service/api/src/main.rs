use std::sync::Arc;

use clap::Parser;
use ferriscord_error::ApiError;
use ferriscord_server::{get_addr, run_server};
use tracing_subscriber::EnvFilter;

use crate::{
    args::{Args, log::LogArgs},
    router::router,
    state::state,
};

mod args;
mod handlers;
mod router;
mod state;

fn init_logger(args: &LogArgs) {
    let filter = EnvFilter::try_new(&args.filter).unwrap_or_else(|err| {
        eprintln!("invalid log filter: {err}");
        eprintln!("using default log filter: info");
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

    let app_state = state(args.clone()).await?;

    let router = router(app_state)?;

    let addr = get_addr(&args.server.host, args.server.port)
        .await
        .map_err(|e| ApiError::Unknown {
            message: e.to_string(),
        })?;

    run_server(addr, router, args.server.tls.clone()).await;

    Ok(())
}
