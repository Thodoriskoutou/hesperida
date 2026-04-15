---
title: System Architecture
sidebar_position: 1
---

# System Architecture

Hesperida has three primary runtime planes:

1. **Data plane**: SurrealDB (`db`)
2. **Execution plane**: Orchestrator + tool containers
3. **Control/UI plane**: SvelteKit `web` (API + dashboard)

## Runtime Topology

- `db`: SurrealDB
- `db-init`: imports `schema.surql`
- `orchestrator`: subscribes to jobs and runs tool containers via Docker socket
- `web`: SvelteKit service for API and dashboard
- `apprise`: outbound notification service
- `pdf`: Gotenberg for HTML-to-PDF conversion

## Job Execution Pipeline

1. `jobs` row is created.
2. Orchestrator picks pending jobs.
3. `probe` runs first.
4. Follow-up tasks are enqueued in `job_queue`.
5. Tools execute independently and persist results.
6. DB events link results to jobs and finalize queue/job status.

## Queue Model

`job_queue.status` values:

- `pending`
- `waiting`
- `processing`
- `completed`
- `failed`
- `canceled`

`canceled` tasks are excluded from normal execution and can force parent job failure.

## Web Runtime Modes

`APP_MODE` controls exposed surfaces:

- `both`: API + dashboard
- `api`: API only
- `dashboard`: dashboard only

Route gating is enforced in `hooks.server.ts`.

## Data Ownership Model

- Websites have a single `owner` and multiple `users` (members).
- ACL combines user role + tenant group + website membership.
- `is_superuser=true` bypasses tenant scoping.
- Website verification is stored in shared records keyed by `(group, registrable_domain)`.
- Verification method is tracked as `dns` or `file`.

## Additional Components

- **Notifications**: blocking notification delivery for forgot/invite/transfer flows.
- **Reports**: SSR HTML reports at `/jobs/{id}/pdf`, converted by Gotenberg.

{/* TODO:Add sequence diagrams for (1) job lifecycle and (2) report generation flow. */}
