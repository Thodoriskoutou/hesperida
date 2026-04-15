---
title: Deployment Notes
sidebar_position: 1
---

# Deployment Notes

## Topology Choices

### All-in-one

Use profile `aio` for single-host deployments.

```bash
docker compose --profile aio up -d
```

### Development Runtime

Use profile `dev` for local backend development (`db` + `db-init` + `orchestrator`).

```bash
docker compose --profile dev up -d
```

### Split DB / Backend

Use `database` and `backend` profiles when SurrealDB is hosted separately.

```bash
docker compose run --rm db-init
docker compose --profile backend up -d
```

## Required Runtime Services

- `web`
- `orchestrator`
- `db` (or external SurrealDB)

Optional but recommended:

- `apprise` (notification delivery)
- `pdf` (Gotenberg)

## Network Model

No `network_mode: host` is required.

- Orchestrator attaches spawned tool containers to its active Docker network.
- Services communicate using compose hostnames (for example `db`, `pdf`, `apprise`).

## Persistence

- SurrealDB data: volume-backed (`data/`)
- Screenshots/results metadata: persisted in DB/file references

## Environment Management

Start from `.env.example` and set:

- database credentials and address
- `WEB_API_KEY`
- auth and signup flags
- notification and PDF service URLs

{/* TODO:Add hardened production compose example (resource limits, restart policy, health checks). */}
