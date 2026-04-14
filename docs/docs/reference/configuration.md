---
title: Configuration
sidebar_position: 1
---

# Configuration

This page lists the most important environment variables.

## Core Runtime

| Variable | Purpose |
| --- | --- |
| `APP_MODE` | `both`, `api`, or `dashboard` route gating |
| `WEB_API_KEY` | required header value for protected API requests |
| `API_URL` / `API_KEY` | dashboard-to-API server-side calls (dashboard mode) |

## Database

| Variable | Purpose |
| --- | --- |
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
| `COOKIE_MAX_AGE_SECONDS` | session cookie max age (default 1 hour) |

## Verification

| Variable | Purpose |
| --- | --- |
| `WEBSITE_VERIFICATION_TTL_SECONDS` | cache TTL for website verification checks |

## Notifications

| Variable | Purpose |
| --- | --- |
| `APPRISE_URL` | Apprise API endpoint |
| `NOTIFICATION_EMAIL_TARGET_TEMPLATE` | template target used for invite/forgot flows |
| `NOTIFICATION_BRAND_LOGO_URL` | logo used in long-form notification templates |

## Reporting

| Variable | Purpose |
| --- | --- |
| `GOTENBERG_URL` | PDF conversion service endpoint |

## Scoring

| Variable | Purpose |
| --- | --- |
| `SECURITY_SCORE_THRESHOLD` | threshold used by security scoring logic |

{/* TODO:Add a complete env reference table generated from `.env.example` once variable naming is fully stabilized. */}
