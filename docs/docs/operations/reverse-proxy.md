---
title: Reverse Proxy
sidebar_position: 2
---

# Reverse Proxy

Most Docker deployments already have a reverse proxy. The default `docker-compose.yaml` is intended for that setup: it exposes the dashboard on localhost and leaves TLS termination to your existing proxy.

Hesperida also ships `docker-compose-caddy.yaml` for deployments that want a bundled Caddy container. That file terminates public HTTP/HTTPS traffic and forwards dashboard requests to the internal `web` service.

## Existing Reverse Proxy

With the default Compose file, proxy your public hostname to the dashboard listener on the Docker host:

```caddy
my.domain.com {
	reverse_proxy 127.0.0.1:3000
}
```

Use `WEB_PORT` if you changed the host port in `.env`.

Set the public dashboard origin:

```env
DASHBOARD_URL=https://my.domain.com
SESSION_COOKIE_SECURE=true
```

`DASHBOARD_URL` is used for notification links and report URLs. `SESSION_COOKIE_SECURE=true` should be used when the dashboard is served over HTTPS.

## Bundled Caddy Service

The optional Caddy Compose file:

- uses the `caddy:2-alpine` image
- joins the same Compose network as `web`
- listens on host ports `80`, `443`, and `443/udp`
- mounts the root `Caddyfile` at `/etc/caddy/Caddyfile`
- stores certificates/config in `caddy_data` and `caddy_config` volumes
- keeps `web`, `db`, and `pdf` private by not publishing their ports

Start the all-in-one stack with bundled Caddy:

```bash
docker compose -f docker-compose-caddy.yaml --profile aio up -d
```

or, when using an external database:

```bash
docker compose -f docker-compose-caddy.yaml --profile backend up -d
```

## Configure The Domain

Edit the root `Caddyfile` and replace the placeholder domain:

```caddy
my.domain.com {
	reverse_proxy web:3000
}
```

Use a real DNS name that resolves to the host running Hesperida. Caddy will request and renew TLS certificates automatically when ports `80` and `443` are reachable from the internet.

## Optional Internal Services

The included `Caddyfile` has commented examples for exposing internal services under paths:

```caddy
# handle_path /pdf/* {
# 	reverse_proxy pdf:3000
# }

# handle_path /apprise/* {
# 	reverse_proxy apprise:8000
# }
```

These are disabled by default. The dashboard talks to `pdf` and `apprise` over the internal Compose network, so exposing them publicly is usually unnecessary. Keep them private unless you have a specific operational reason.

## Ports

With default `docker-compose.yaml`, the dashboard remains loopback-only:

```yaml
ports:
  - "127.0.0.1:${WEB_PORT:-3000}:3000"
```

With `docker-compose-caddy.yaml`, Caddy is the only public listener. Do not publish SurrealDB directly unless you are intentionally managing database access yourself.
