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

{/* TODO:Add an explicit “known error messages” table with root-cause mapping from production logs. */}
