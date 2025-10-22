use std::{
    net::{SocketAddr, ToSocketAddrs},
    path::PathBuf,
};

use axum::Router;
use axum_server::tls_rustls::RustlsConfig;
use tracing::info;

use crate::args::ServerTlsArgs;

pub mod args;

pub struct ServerTls {
    pub cert: PathBuf,
    pub key: PathBuf,
}

pub async fn get_addr(host: &str, port: u16) -> Result<SocketAddr, Box<dyn std::error::Error>> {
    let addrs = format!("{}:{}", host, port)
        .to_socket_addrs()?
        .collect::<Vec<SocketAddr>>();

    let socket = match addrs.first() {
        Some(addr) => *addr,
        None => return Err("No socket addresses found".into()),
    };

    Ok(socket)
}

pub async fn run_server(addr: SocketAddr, router: Router, cfg: Option<ServerTlsArgs>) {
    if let Some(tls) = cfg {
        rustls::crypto::aws_lc_rs::default_provider()
            .install_default()
            .expect("failed to install crypto provider");

        let tls_cfg = RustlsConfig::from_pem_file(tls.cert.clone(), tls.key.clone())
            .await
            .unwrap();

        info!("listening on {addr}");
        axum_server::bind_rustls(addr, tls_cfg)
            .serve(router.into_make_service())
            .await
            .unwrap();
    } else {
        info!("listening on {addr}");
        axum_server::bind(addr)
            .serve(router.into_make_service())
            .await
            .unwrap();
    }
}
