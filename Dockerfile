FROM rust:1.91-bookworm AS rust-build

WORKDIR /usr/local/src/ferriscord

RUN cargo install sqlx-cli --no-default-features --features postgres

COPY Cargo.toml Cargo.lock ./
COPY libs/auth/Cargo.toml libs/auth/
COPY libs/config/Cargo.toml libs/config/
COPY libs/core/Cargo.toml libs/core/
COPY libs/entities/Cargo.toml libs/entities/
COPY libs/errors/Cargo.toml libs/errors/
COPY libs/pagination/Cargo.toml libs/pagination/
COPY libs/permission/Cargo.toml libs/permission/
COPY libs/server/Cargo.toml libs/server/
COPY libs/storage/Cargo.toml libs/storage/

COPY api/Cargo.toml api/

ENV SQLX_OFFLINE=true

RUN \
    mkdir -p api/src \
    libs/auth/src \
    libs/config/src \
    libs/core/src \
    libs/entities/src \
    libs/errors/src \
    libs/pagination/src \
    libs/permission/src \
    libs/server/src \
    libs/storage/src && \

    touch libs/auth/src/lib.rs && \
    touch libs/config/src/lib.rs && \
    touch libs/core/src/lib.rs && \
    touch libs/entities/src/lib.rs && \
    touch libs/errors/src/lib.rs && \
    touch libs/pagination/src/lib.rs && \
    touch libs/permission/src/lib.rs && \
    touch libs/server/src/lib.rs && \
    touch libs/storage/src/lib.rs && \
    echo "fn main() {}" > api/src/main.rs && \
    cargo build --release

COPY libs/auth libs/auth
COPY libs/config libs/config
COPY libs/core libs/core
COPY libs/entities libs/entities
COPY libs/errors libs/errors
COPY libs/pagination libs/pagination
COPY libs/permission libs/permission
COPY libs/server libs/server
COPY libs/storage libs/storage

COPY api api
COPY .sqlx .sqlx

COPY migrations migrations

RUN \
    touch libs/auth/src/lib.rs && \
    touch libs/config/src/lib.rs && \
    touch libs/core/src/lib.rs && \
    touch libs/entities/src/lib.rs && \
    touch libs/errors/src/lib.rs && \
    touch libs/pagination/src/lib.rs && \
    touch libs/permission/src/lib.rs && \
    touch libs/server/src/lib.rs && \
    touch libs/storage/src/lib.rs && \
    cargo build --release


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

FROM runtime AS api

COPY --from=rust-build /usr/local/src/ferriscord/target/release/api /usr/local/bin/
COPY --from=rust-build /usr/local/src/ferriscord/migrations /usr/local/src/ferriscord/migrations
COPY --from=rust-build /usr/local/cargo/bin/sqlx /usr/local/bin/

EXPOSE 80

ENTRYPOINT [ "api" ]

FROM node:20.14.0-alpine AS webapp-build

WORKDIR /usr/local/src/ferriscord

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN \
    corepack enable && \
    corepack prepare pnpm@9.15.0 --activate && \
    apk --no-cache add dumb-init=1.2.5-r3

COPY webapp/package.json webapp/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY wepapp/ .
RUN pnpm run build

FROM nginx:1.28.0-alpine3.21-slim AS webapp

COPY --from=webapp-build /usr/local/src/ferriscord/dist /usr/local/src/ferriscord
COPY webapp/nginx.conf /etc/nginx/conf.d/default.conf
COPY webapp/docker-entrypoint.sh /docker-entrypoint.d/docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.d/docker-entrypoint.sh
