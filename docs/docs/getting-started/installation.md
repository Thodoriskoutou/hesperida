---
title: Installation
sidebar_position: 1
---

# Installation

## Prerequisites

- Docker + Docker Compose
- A Linux host with at least:
  - 2 CPU cores / 4 threads
  - 4GB RAM
  - ~6GB free storage

## Quick Start

1. Clone the repository.
2. Copy and edit the environment file.
3. Start services using Compose profiles.

```bash
git clone https://github.com/rallisf1/hesperida.git
cd hesperida
cp .env.example .env
docker compose --profile aio up -d
```

Open the web service at `http://localhost:3000` (or your configured host).

## Superuser Bootstrap

At startup, the API ensures a superuser account exists:

- Email: `hesperida@local.me`
- Password: value of `SURREAL_PASS`

You should rotate this account credentials after initial setup.

{/* TODO:Document the final production hardening baseline (TLS termination, reverse proxy, backup strategy). */}

## Compose Profiles

- `aio`: full local stack (`db`, `db-init`, `orchestrator`, `web`, `apprise`, `pdf`)
- `backend`: backend services (for remote DB setups)
- `database`: SurrealDB + schema import only
- `tools`: build/test tool images

## Upgrade Flow

```bash
docker compose --profile aio down
git pull
docker compose --profile tools build
docker compose build orchestrator web
docker compose --profile aio up -d
```

{/* TODO:Add zero-downtime upgrade procedure once blue/green or rolling strategy is implemented. */}
