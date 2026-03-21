<!-- PROJECT BANNER -->
<p align="center">
  <img src="./ferriscord.png" alt="FerrisCord — Open‑Source Discord Alternative in Rust" width="100" />
</p>

<p align="center">
  <strong>FerrisCord</strong> — Open‑Source, High‑Performance Discord Alternative<br/>
  <em>Cloud‑native • Extensible • Built in Rust</em>
</p>

<p align="center">
  <a href="https://github.com/ferriskey/ferriscord/actions">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/ferriskey/ferriscord/docker.yaml?label=CI&logo=github" />
  </a>
  <a href="https://github.com/ferriskey/ferriscord/releases">
    <img alt="Release" src="https://img.shields.io/github/v/release/ferriskey/ferriscord?display_name=tag&logo=semantic-release" />
  </a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" />
  </a>
  <a href="https://github.com/ferriskey/ferriscord/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/ferriskey/ferriscord?logo=github" />
  </a>
  <a href="https://github.com/sponsors/ferriskey">
    <img alt="Sponsor" src="https://img.shields.io/badge/Sponsor-❤-ff69b4?logo=github-sponsors" />
  </a>
</p>

---

## ✨ Why FerrisCord?

FerrisCord is a modern **self-hosted Discord alternative** built with **Rust** and **React**.
It aims to be a fully open-source, privacy-respecting communication platform — fast, modular, and cloud-native by design.

- 🦀 **Performance-first** — Rust backend with async I/O and low latency.
- 🧱 **Domain-Driven Design** — clean architecture on both backend and frontend.
- 💬 **Real-time messaging** — WebSocket-powered chat with presence & typing indicators.
- 🏢 **Multi-server (guilds)** — channels, roles, permissions, and invite system.
- 🔐 **OIDC Authentication** — powered by [FerrisKey](https://github.com/ferriskey/ferriskey).
- 📁 **File attachments** — S3-compatible storage via RustFS.
- ☁️ **Cloud‑native** — Docker Compose ready; designed for Kubernetes.

## 🧭 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Features

| Capability                      | Details |
|---------------------------------|---|
| **Guilds (Servers)**            | Create and manage servers with channels, roles, and members. |
| **Text Channels**               | Real-time messaging with history and attachments. |
| **Direct Messages**             | Private conversations between users. |
| **Friend System**               | Send and accept friend requests. |
| **User Presence**               | Online/offline status and activity tracking. |
| **Invite System**               | Shareable invite codes with expiry. |
| **File Attachments**            | Upload files via S3-compatible RustFS storage. |
| **Permission System**           | Role-based access control per guild and channel. |
| **OIDC Authentication**         | Secure login via FerrisKey identity provider. |
| **OpenAPI Docs**                | Interactive API docs at `/scalar`. |

> **License:** Apache‑2.0. No paywalls. Community‑first.

## 🏗️ Architecture

FerrisCord follows a **Domain-Driven Design** on both sides:

```
ferriscord/
├── api/            # Rust/Axum HTTP + WebSocket API
├── libs/           # Shared Rust libraries (core, auth, entities, storage…)
├── webapp/         # React 19 + TypeScript frontend
├── migrations/     # PostgreSQL migrations (sqlx)
└── docker/         # Docker init scripts
```

**Backend stack:** Rust · Axum · SQLx · PostgreSQL · Tokio · Utoipa (OpenAPI)

**Frontend stack:** React 19 · TypeScript · TanStack Router/Query · Tailwind CSS · Zustand · Zod

**Infrastructure:** Docker Compose · RustFS (S3) · FerrisKey (OIDC)

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
# Start FerrisCord (API, webapp, Postgres, RustFS)
docker compose up -d

# Start FerrisKey (OIDC identity provider)
docker compose --profile ferriskey up -d
```

Services started:

| Service      | URL                          |
|--------------|------------------------------|
| Webapp       | http://localhost:7555        |
| API          | http://localhost:7001        |
| OpenAPI Docs | http://localhost:7001/scalar |
| FerrisKey    | http://localhost:7333        |
| RustFS       | http://localhost:9000        |

Default credentials: `admin` / `admin`

### Option B — Local Development

**Prerequisites:** Rust (stable), Node 22+, pnpm, Docker (for Postgres & services)

1. Start infrastructure services:

```bash
docker compose up -d postgres rustfs
docker compose --profile ferriskey up -d
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your values (client secret, storage keys…)
```

3. Run database migrations:

```bash
sqlx migrate run --source migrations
```

4. Start the API:

```bash
cargo run -p ferriscord-api
```

5. Configure and start the frontend:

```bash
cd webapp
cp .env.example .env
pnpm install
pnpm dev
```

Then visit [http://localhost:5173](http://localhost:5173).

## ⚙️ Configuration

### API (`.env` at project root)

Copy `.env.example` to `.env` and adjust values:

```env
DATABASE_URL=postgres://ferriscord:ferriscord@127.0.0.1:5433/ferriscord
DATABASE_PORT=5433
DATABASE_USER=ferriscord
DATABASE_PASSWORD=ferriscord

AUTH_ISSUER=http://localhost:7333/realms/ferrislabs
AUTH_CLIENT_ID=ferriscord-api
AUTH_CLIENT_SECRET=your_client_secret

ALLOWED_ORIGINS=http://localhost:5173

STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY_ID=your_access_key_id
STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
STORAGE_FORCE_PATH_STYLE=true
```

### Frontend (`webapp/.env`)

Copy `webapp/.env.example` to `webapp/.env`:

```env
VITE_OIDC_ISSUER_URL=http://localhost:7333/realms/ferrislabs
VITE_OIDC_CLIENT_ID=ferriscord-front
VITE_API_URL=http://localhost:7001
```

## 🤝 Contributing

Contributions of all kinds are welcome — bugfixes, features, docs, testing.

1. Fork the repository
2. Pick an open issue
3. Open a PR with a concise description

## 📜 License

Apache‑2.0 — free to use, modify, and distribute.

## 🔗 Links

- 📂 Source: <https://github.com/ferriskey/ferriscord>
- 🔑 Auth provider: <https://github.com/ferriskey/ferriskey>
