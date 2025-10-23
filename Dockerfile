FROM rust:1.90-bookworm AS rust-build

WORKDIR /usr/local/src/ferriscord

RUN cargo install sqlx-cli --no-default-features --features postgres

COPY Cargo.toml Cargo.lock ./
COPY libs ./libs/
COPY services ./services/

ENV SQLX_OFFLINE=true
RUN cargo build --release


FROM debian:bookworm-slim AS runtime

RUN \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates=20230311+deb12u1 \
    libssl3=3.0.17-1~deb12u2 && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup \
    --system \
    --gid 1000 \
    ferriscord && \
    adduser \
    --system \
    --no-create-home \
    --disabled-login \
    --uid 1000 \
    --gid 1000 \
    ferriscord

USER ferriscord

FROM runtime AS guild

COPY --from=rust-build /usr/local/src/ferriscord/target/release/guild-service /usr/local/bin/
COPY --from=rust-build /usr/local/src/ferriscord/services/guild-service/core/migrations /usr/local/src/ferriscord/guild/migrations
COPY --from=rust-build /usr/local/cargo/bin/sqlx /usr/local/bin/

EXPOSE 80

ENTRYPOINT [ "guild-service" ]
