---
title: Glossary
sidebar_position: 3
---

# Glossary

## Job

A scan request for one website, containing a selected set of tool types.

## Task (Queue Item)

A single executable unit in `job_queue`, usually one tool run or one fanout target.

## Owner

Primary website controller stored in `websites.owner`.

## Member

Additional user with access to a website, stored in `websites.users`.

## Group

Tenant-like user scope used by ACL to separate admin/editor/viewer visibility.

## Superuser

User with `is_superuser=true`, allowed global cross-group access.

## Verification Code

Per-website value used for DNS/HTTP ownership verification before job creation.

## Results Aggregation

API responses under `/api/v1/results/jobs/*` that merge and normalize tool output.

## Report Route

Public SSR endpoint `/jobs/{id}/pdf` for completed jobs, used as PDF source.

{/* TODO:Expand glossary with all status enumerations and error-code conventions. */}
