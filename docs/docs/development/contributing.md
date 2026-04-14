---
title: Contributing
sidebar_position: 1
---

# Contributing

## Workflow

1. Open an issue with clear reproduction or proposal.
2. Fork and create a focused branch.
3. Implement and test changes.
4. Submit PR referencing the issue.

## Local Dev Notes

- Root project includes multiple services and tools.
- `web` is a SvelteKit app with dashboard + API.
- `docs` is a standalone Docusaurus workspace.

## Useful Commands

```bash
# Main stack
docker compose --profile aio up -d

# Rebuild tool images
docker compose --profile tools build

# Run docs locally
cd docs
npm run start
```

## Documentation Changes

- Keep architecture docs aligned with `ARCHITECTURE.md`.
- Keep feature/release docs aligned with `CHANGELOG.md`.
- Prefer adding explicit `TODO` markers for pending product decisions.

{/* TODO:Add coding standards and commit-message conventions once team process is formalized. */}
