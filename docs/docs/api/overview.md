---
title: API Overview
sidebar_position: 1
---

# API Overview

Base path: `/api/v1`

API and dashboard share the same backend implementation in the `web` service.

## Authentication Model

Most routes require:

1. `x-api-key` header (app-level key)
2. user authentication (cookie session or bearer token)

Auth routes are exempt from `x-api-key`:

- `/api/v1/auth/signup`
- `/api/v1/auth/signin`
- `/api/v1/auth/signout`
- `/api/v1/auth/me`
- `/api/v1/auth/forgot`

## OpenAPI

OpenAPI is generated from route JSDoc blocks and exposed via the dashboard API page.

{/* TODO:Add final public OpenAPI JSON endpoint URL once deployment path is fixed. */}

## Response Envelope

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "bad_request",
    "message": "Human-readable message"
  }
}
```

## Pagination Contract

List endpoints support optional `page` + `page_size`.

- both omitted: full list
- both present: paged list + `total_items`
- one missing: `400 bad_request`
