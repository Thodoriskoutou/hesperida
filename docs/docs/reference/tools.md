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
| `seo` | TypeScript SEO audit and scoring (`@seomator/seo-audit`) | `seo_results` |
| `wcag` | accessibility checks + screenshots | `wcag_results` |
| `security` | aggregated vulnerability findings and score | `security_results` |
| `stress` | load testing and latency metrics | `stress_results` |
| `mail` | DNS based email health | `mail_results` |

## Execution Notes

- `probe` executes first and gates downstream queue creation.
- WCAG may fan out by device profile.
- Queue retries/backoff are managed by orchestrator.

## Expected Runtime

These reference times were measured on a VPS with 4 AMD EPYC 9645 cores, 8GB RAM, and NVMe storage. Target behavior and network latency can change results substantially.

| Tool | Expected time |
| --- | ---: |
| `domain` | 37s |
| `mail` | 14s |
| `probe` | 4s |
| `security` | 10m |
| `seo` | 13s |
| `ssl` | 3s |
| `stress` | 37s |
| `wcag` | 12s per device |
| `whois` | 5s per IP |

## Data Quality Notes

- Geo lookup is persisted at probe time to avoid read-time external API calls.
- DNS records are stored in structured objects keyed by record type.
- Security scoring depends on `SECURITY_SCORE_THRESHOLD`.
- Security runtime is tuned through `SECURITY_NUCLEI_*`, `SECURITY_NIKTO_*`, and `SECURITY_WAPITI_*` variables. The production defaults keep scans web-focused and bounded; higher values may recover slower network-fingerprint findings.
- WCAG can be narrowed with `WCAG_RUN_ONLY` or `WCAG_EXCLUDE_RULES`.
- Stress tests are controlled with `STRESS_*` variables such as rate, duration, method, timeout, workers, headers, body, and latency warning threshold.

{/* TODO:Add per-tool “input options” and “known limitations” sections from source code/config defaults. */}
