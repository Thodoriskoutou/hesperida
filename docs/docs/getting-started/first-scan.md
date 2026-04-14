---
title: First Scan
sidebar_position: 2
---

# First Scan

This section walks through the minimum flow from account creation to results.

## 1. Sign In

- Use the superuser account or create a new account (if signup is enabled).
- Signup is controlled by `AUTH_SIGNUP_ENABLED`.

## 2. Add a Website

Create a website record in dashboard (`/websites/new`) or API (`POST /api/v1/websites`).

## 3. Verify the Website

Hesperida enforces verification before creating jobs.

Accepted verification methods:

1. DNS TXT record:
   - Host: `hesperida.<registrable-domain>`
   - Value: `websites.verification_code`
2. HTTP fallback:
   - URL path: `/hesperida-<verification_code>.txt`
   - Requires HTTP `200`

## 4. Create a Job

Create a job with one or more tool types:

- `probe`, `domain`, `whois`, `ssl`, `seo`, `wcag`, `security`, `stress`

The orchestrator schedules queue tasks and each tool writes to its `*_results` table.

## 5. Track Progress

- Dashboard:
  - Homepage queue table + live updates
  - `/job-queue` list/details
- API:
  - `/api/v1/job-queue`
  - `/api/v1/jobs/{id}`

## 6. View Results and PDF

- Detailed results: dashboard job detail page or `/api/v1/results/jobs/{id}`
- Client-facing report: `/jobs/{id}/pdf` (completed jobs only)
- Generated PDF: “Get PDF Report” action on dashboard job detail

{/* TODO:Add sample screenshots for each step after UI is considered stable. */}
