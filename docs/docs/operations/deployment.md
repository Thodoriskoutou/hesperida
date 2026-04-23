---
title: Deployment Notes
sidebar_position: 1
---

# Deployment Notes

This page follows the deployment flow in the repository `README.md`.

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/rallisf1/hesperida.git
cd hesperida
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Pull worker images:

```bash
docker compose --profile tools pull
```

4. Start the stack:
- Self-hosted DB:

  ```bash
  docker compose --profile aio up -d
  ```

- External SurrealDB / SurrealDB SaaS:

  ```bash
  docker compose --profile backend up -d
  ```

5. Open the dashboard at `http://localhost:3000` (or your configured host/port).

## Bootstrap Superuser

- Email: `hesperida@local.me`
- Password: value of `SURREAL_PASS`

## Updating

For all-in-one (`aio`) deployments:

```bash
docker compose --profile aio down
docker compose --profile aio pull
docker compose --profile tools pull
docker compose --profile aio up -d
```

For `backend` deployments, use the same flow but replace `aio` with `backend` where applicable.

## Runtime Notes

- `web` and `orchestrator` are required in all active deployments.
- `db` is required only when not using external SurrealDB.
- `apprise` and `pdf` are part of backend profiles for notifications and PDF export.
- `tools` profile is used to pull/build scan worker images; those containers are not long-running services.

## Environment Highlights

Start from `.env.example` and configure at least:

- `SURREAL_*` connection/auth values
- `WEB_API_KEY`
- `SMTP_*` (required for system emails: forgot password, invite, onboarding)
