---
title: Configuration
sidebar_position: 1
---

# Configuration

This page lists the environment variables exposed by `.env.example`.

## Core Runtime

| Variable | Purpose |
| --- | --- |
| `DEBUG` | enables verbose runtime logging when set to `true` |
| `NODE_ENV` | runtime mode for Node/Bun services (`production` by default) |
| `APP_MODE` | `both`, `api`, or `dashboard` route gating |
| `WEB_API_KEY` | required header value for protected API requests |
| `API_URL` / `API_KEY` | dashboard-to-API server-side calls (dashboard mode) |
| `DASHBOARD_URL` | public dashboard URL used in notifications and generated links |
| `WEB_PORT` | host port bound to `web:3000` in local Compose deployments |
| `WP_PATH` | path to the Wappalyzer database inside the web container |

## Orchestrator

| Variable | Purpose |
| --- | --- |
| `MAX_ATTEMPTS` | max retry attempts for failed queue tasks before final `failed` status |
| `JOB_QUEUE_RETENTION` | daily retention window (in days) for `job_queue` cleanup (default `365`) |

## Database

| Variable | Purpose |
| --- | --- |
| `DB_PORT` | host port bound to SurrealDB in local Compose deployments |
| `SURREAL_PROTOCOL` | websocket/http protocol |
| `SURREAL_ADDRESS` | host:port of SurrealDB |
| `SURREAL_NAMESPACE` | namespace |
| `SURREAL_DATABASE` | database |
| `SURREAL_USER` | db user |
| `SURREAL_PASS` | db password + superuser bootstrap password |

## Auth & ACL

| Variable | Purpose |
| --- | --- |
| `AUTH_SIGNUP_ENABLED` | enable/disable public signup |
| `SCHEDULE_MIN_INTERVAL_SECONDS` | minimum allowed schedule interval in seconds (default `3600`) |
| `SESSION_COOKIE_NAME` | dashboard session cookie name |
| `SESSION_COOKIE_SECURE` | mark dashboard session cookie as secure (`true`/`false`) |
| `SESSION_COOKIE_MAX_AGE` | dashboard session cookie max age in seconds (default `3600`) |

## Notifications

| Variable | Purpose |
| --- | --- |
| `APPRISE_URL` | Apprise API endpoint used for notification channel tests (web) and job-triggered delivery (orchestrator) |
| `APPRISE_API_KEY` | optional Apprise API key attached to notification requests |
| `APPRISE_WORKER_COUNT` | Apprise worker process count |
| `NOTIFICATION_BRAND_LOGO_URL` | logo used in long-form notification templates |

## System Email (SMTP)

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP auth user |
| `SMTP_PASS` | SMTP auth password |
| `SMTP_SECURE` | use SMTPS/TLS (`true`/`false`) |
| `SMTP_FROM` | sender address used for forgot/invite/onboarding emails |

Routes that require SMTP (return `503 smtp_not_configured` when unavailable):

- `POST /api/v1/auth/forgot`
- `POST /api/v1/users`
- `POST /api/v1/websites/{id}/invite`
- `POST /api/v1/websites/{id}/transfer-ownership`

## Reporting

| Variable | Purpose |
| --- | --- |
| `GOTENBERG_URL` | PDF conversion service endpoint |
| `PDF_PORT` | host port bound to Gotenberg in local Compose deployments |

## Security Tool

| Variable | Purpose |
| --- | --- |
| `SECURITY_NUCLEI_TEMPLATES` | optional comma-separated Nuclei template paths/tags to run instead of the default template set |
| `SECURITY_NUCLEI_TIMEOUT` | Nuclei request timeout in seconds (production default `8`) |
| `SECURITY_NUCLEI_RETRIES` | Nuclei retry count (production default `1`) |
| `SECURITY_NIKTO_TIMEOUT` | wrapper-level Nikto process timeout in seconds (production default `600`) |
| `SECURITY_NIKTO_REQUEST_TIMEOUT` | Nikto per-request timeout passed to `nikto -timeout` (production default `6`) |
| `SECURITY_WAPITI_MAX_SCAN_TIME` | Wapiti total scan limit passed to `wapiti --max-scan-time` (production default `600`) |
| `SECURITY_WAPITI_MAX_ATTACK_TIME` | Wapiti per-attack-module limit passed to `wapiti --max-attack-time` (production default `120`) |
| `SECURITY_SCORE_THRESHOLD` | threshold used by security scoring logic |

The production defaults favor web-facing findings and predictable runtime. Higher Nuclei/Wapiti/Nikto limits can recover slower network-fingerprint findings at the cost of longer scans.

## WCAG Tool

| Variable | Purpose |
| --- | --- |
| `WCAG_RUN_ONLY` | optional comma-separated axe rule IDs/tags to run |
| `WCAG_EXCLUDE_RULES` | optional comma-separated axe rule IDs to exclude |

`WCAG_DEVICE_NAME` is task-specific and is set by the orchestrator for each WCAG device queue row.

## Stress Tool

| Variable | Purpose |
| --- | --- |
| `STRESS_RATE` | Vegeta request rate (default `10`) |
| `STRESS_DURATION` | Vegeta attack duration (default `30s`) |
| `STRESS_METHOD` | HTTP method (default `GET`) |
| `STRESS_TIMEOUT` | per-request timeout (default `10s`) |
| `STRESS_WORKERS` | initial Vegeta workers (default `10`) |
| `STRESS_MAX_WORKERS` | maximum Vegeta workers (default `100`) |
| `STRESS_HEADERS` | JSON object of request headers (default `{}`) |
| `STRESS_BODY` | optional request body |
| `STRESS_LATENCY_WARN_MS` | latency warning threshold used in scoring (default `500`) |

## Compose Notes

Production Compose files pass tool runtime variables through the `orchestrator` service because scans are launched as short-lived tool containers. `docker-compose.dev.yaml` also keeps direct tool environment blocks for manual tool runs during development.
