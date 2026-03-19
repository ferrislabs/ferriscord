use std::path::PathBuf;

pub mod auth;
pub mod database;
pub mod log;
pub mod storage;

#[derive(clap::Args, Debug, Clone)]
pub struct ServerArgs {
    #[arg(
        short,
        long = "allowed-origins",
        env = "ALLOWED_ORIGINS",
        num_args = 0..,
        value_delimiter = ',',
        long_help = "The port to run the application on",
    )]
    pub allowed_origins: Vec<String>,
    #[arg(
        short = 'H',
        long = "server-host",
        env = "SERVER_HOST",
        name = "SERVER_HOST",
        default_value = "0.0.0.0",
        long_help = "The host to run the application on"
    )]
    pub host: String,
    #[arg(
        short = 'P',
        long = "server-port",
        env = "SERVER_PORT",
        name = "SERVER_PORT",
        default_value_t = 7001,
        long_help = "The port to run the application on"
    )]
    pub port: u16,

    #[arg(
        long = "internal-port",
        env = "INTERNAL_SERVER_PORT",
        name = "INTERNAL_SERVER_PORT",
        default_value_t = 7002,
        long_help = "The internal port to run the application on"
    )]
    pub internal_port: u16,
    #[command(flatten)]
    pub tls: Option<ServerTlsArgs>,
}

#[derive(clap::Args, Debug, Clone)]
#[group(requires_all = ["SERVER_TLS_CERT", "SERVER_TLS_KEY"])]
pub struct ServerTlsArgs {
    #[arg(
        long = "server-tls-cert",
        env = "SERVER_TLS_CERT",
        name = "SERVER_TLS_CERT",
        long_help = "Path to the TLS cert file in PEM format",
        required = false
    )]
    pub cert: PathBuf,
    #[arg(
        long = "server-tls-key",
        env = "SERVER_TLS_KEY",
        name = "SERVER_TLS_KEY",
        long_help = "Path to the TLS key file in PEM format",
        required = false
    )]
    pub key: PathBuf,
}

impl Default for ServerArgs {
    fn default() -> Self {
        Self {
            allowed_origins: vec![],
            host: "0.0.0.0".into(),
            port: 7000,
            internal_port: 7001,
            tls: None,
        }
    }
}
