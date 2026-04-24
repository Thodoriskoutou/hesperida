---
title: Troubleshooting
sidebar_position: 2
---

# Troubleshooting

## Orchestrator Cannot Run Tool Containers

Check:

- Docker socket mount exists: `/var/run/docker.sock`
- tool images are present (`docker images`)
- tool directories are available in orchestrator container

Try:

```bash
docker compose --profile tools build
docker compose restart orchestrator
```

## DB Contention / Write Errors

Symptoms:

- intermittent task write failures under load
- retries increasing on queue rows

Mitigation:

- reduce concurrent heavy scans
- increase host CPU/RAM
- re-run failed jobs once load drops

## Queue Table Growing Too Much

Check:

- `JOB_QUEUE_RETENTION` value in orchestrator environment (days)
- orchestrator logs for daily cleanup execution/errors

Notes:

- cleanup runs daily and deletes `job_queue` rows older than `JOB_QUEUE_RETENTION`
- default retention is `365` days when unset/invalid

## Invite / Transfer / Forgot Fails

Check:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE` compatibility with provider requirements
- outbound network reachability from `web`

Typical behavior:

- If SMTP is missing: API returns `503 smtp_not_configured`
- If send fails after token/user prep: API returns `502 notification_failed` and rolls back route-side temporary changes

## Dashboard Session Drops

Common causes:

- cookie expired and token refresh failed
- invalidated session token
- env mismatch after restart (`SURREAL_PASS`, auth config)

Check web logs around `auth/me` and session refresh handling.

## PDF Generation Fails

Check:

- `pdf` service is running
- `GOTENBERG_URL` points to service hostname reachable from `web`
- report URL is reachable by Gotenberg container

## Caddy / HTTPS Fails

Check:

- you started the Caddy stack with `docker-compose-caddy.yaml`
- the root `Caddyfile` uses your real public hostname, not `my.domain.com`
- DNS for that hostname resolves to the Docker host
- host ports `80` and `443` are reachable from the internet
- `DASHBOARD_URL` matches the public origin, for example `https://my.domain.com`
- `SESSION_COOKIE_SECURE=true` when serving the dashboard over HTTPS

Useful commands:

```bash
docker compose -f docker-compose-caddy.yaml logs caddy
docker compose -f docker-compose-caddy.yaml ps caddy web
```

{/* TODO:Add an explicit “known error messages” table with root-cause mapping from production logs. */}
