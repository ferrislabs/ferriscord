use std::{
    net::{SocketAddr, ToSocketAddrs},
    sync::Arc,
};

use axum_server::tls_rustls::RustlsConfig;
use clap::Parser;
use tracing_subscriber::EnvFilter;

use crate::{
    args::{Args, log::LogArgs},
    errors::ApiError,
    router::router,
    state::state,
};

mod args;
mod errors;
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

    let addr = {
        let addrs = format!("{}:{}", args.server.host, args.server.port)
            .to_socket_addrs()
            .map_err(|e| ApiError::Unknown {
                message: e.to_string(),
            })?
            .collect::<Vec<SocketAddr>>();

        match addrs.first() {
            Some(addr) => *addr,
            None => {
                tracing::error!("At least one host and port must be provided");
                return Err(ApiError::Unknown {
                    message: "At least one host and port must be provided".to_string(),
                });
            }
        }
    };

    if let Some(tls) = &args.server.tls {
        tracing::debug!("initializing crypto provider");
        rustls::crypto::aws_lc_rs::default_provider()
            .install_default()
            .expect("failed to install crypto provider");

        tracing::debug!("loading tls config");

        let tls_cfg = RustlsConfig::from_pem_file(tls.cert.clone(), tls.key.clone())
            .await
            .map_err(|e| ApiError::Unknown {
                message: e.to_string(),
            })?;

        tracing::info!("listening on {addr}");

        axum_server::bind_rustls(addr, tls_cfg)
            .serve(router.into_make_service())
            .await
            .map_err(|e| ApiError::Unknown {
                message: e.to_string(),
            })?;
    } else {
        tracing::info!("listening on {addr}");

        axum_server::bind(addr)
            .serve(router.into_make_service())
            .await
            .map_err(|e| ApiError::Unknown {
                message: e.to_string(),
            })?;
    }

    Ok(())
}
