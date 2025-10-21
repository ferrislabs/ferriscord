use crate::errors::ApiError;

mod args;
mod errors;

#[tokio::main]
async fn main() -> Result<(), ApiError> {
    println!("hello world");

    Ok(())
}
