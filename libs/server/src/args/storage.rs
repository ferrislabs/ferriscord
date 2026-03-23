use ferriscord_config::StorageConfig;

#[derive(clap::Args, Debug, Clone)]
pub struct StorageArgs {
    #[arg(
        long = "storage-endpoint",
        env = "STORAGE_ENDPOINT",
        name = "STORAGE_ENDPOINT",
        long_help = "S3-compatible endpoint URL (leave unset for AWS S3). Example: http://localhost:3900"
    )]
    pub endpoint: Option<String>,

    #[arg(
        long = "storage-region",
        env = "STORAGE_REGION",
        name = "STORAGE_REGION",
        default_value = "us-east-1",
        long_help = "S3 region"
    )]
    pub region: String,

    #[arg(
        long = "storage-access-key-id",
        env = "STORAGE_ACCESS_KEY_ID",
        name = "STORAGE_ACCESS_KEY_ID",
        default_value = "",
        long_help = "S3 access key ID"
    )]
    pub access_key_id: String,

    #[arg(
        long = "storage-secret-access-key",
        env = "STORAGE_SECRET_ACCESS_KEY",
        name = "STORAGE_SECRET_ACCESS_KEY",
        default_value = "",
        long_help = "S3 secret access key"
    )]
    pub secret_access_key: String,

    #[arg(
        long = "storage-public-url",
        env = "STORAGE_PUBLIC_URL",
        name = "STORAGE_PUBLIC_URL",
        long_help = "Public-facing base URL for pre-signed URLs (e.g. https://storage.example.com). Replaces the internal endpoint in generated URLs."
    )]
    pub public_url: Option<String>,

    #[arg(
        long = "storage-force-path-style",
        env = "STORAGE_FORCE_PATH_STYLE",
        name = "STORAGE_FORCE_PATH_STYLE",
        default_value_t = false,
        long_help = "Force path-style URLs (required for Garage, RustFS, MinIO)"
    )]
    pub force_path_style: bool,

    #[arg(
        long = "storage-bucket",
        env = "STORAGE_BUCKET",
        name = "STORAGE_BUCKET",
        default_value = "ferriscord",
        long_help = "S3 bucket name"
    )]
    pub bucket: String,
}

impl From<StorageArgs> for StorageConfig {
    fn from(args: StorageArgs) -> Self {
        StorageConfig {
            endpoint: args.endpoint,
            public_url: args.public_url,
            region: args.region,
            access_key_id: args.access_key_id,
            secret_access_key: args.secret_access_key,
            force_path_style: args.force_path_style,
            bucket: args.bucket,
        }
    }
}
