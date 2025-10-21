use ferriscord_error::ApiError;

mod args;

#[tokio::main]
async fn main() -> Result<(), ApiError> {
    println!("hello world");

    Ok(())
}
