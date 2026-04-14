---
title: Scanning Tools
sidebar_position: 2
---

# Scanning Tools

Each tool runs in its own container and writes output to a dedicated results table.

## Tool Matrix

| Tool | Purpose | Result Table |
| --- | --- | --- |
| `probe` | endpoint metadata, technologies, network/server details | `probe_results` |
| `domain` | domain metadata, DNS records, passive subdomains | `domain_results` |
| `whois` | IP whois enrichment | `whois_results` |
| `ssl` | certificate metadata and expiry | `ssl_results` |
| `seo` | SEO audit and scoring | `seo_results` |
| `wcag` | accessibility checks + screenshots | `wcag_results` |
| `security` | aggregated vulnerability findings and score | `security_results` |
| `stress` | load testing and latency metrics | `stress_results` |

## Execution Notes

- `probe` executes first and gates downstream queue creation.
- WCAG may fan out by device profile.
- Queue retries/backoff are managed by orchestrator.

## Data Quality Notes

- Geo lookup is persisted at probe time to avoid read-time external API calls.
- DNS records are stored in structured objects keyed by record type.
- Security scoring depends on `SECURITY_SCORE_THRESHOLD`.

{/* TODO:Add per-tool “input options” and “known limitations” sections from source code/config defaults. */}
