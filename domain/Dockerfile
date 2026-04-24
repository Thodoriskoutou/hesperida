FROM projectdiscovery/subfinder:latest AS subfinder

FROM oven/bun:alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apk add --no-cache whois

WORKDIR /app

COPY ./domain/package.json ./domain/bun.lock /app/

RUN bun install --frozen-lockfile --production --omit=peer

ARG CACHE_BUST

COPY ./domain /app
COPY ./constants.ts /app/constants.ts
COPY ./types.d.ts /app/types.d.ts
COPY ./data/rdap-cache.json /rdap-cache.json

COPY --from=subfinder /usr/local/bin/subfinder /usr/local/bin/

ENTRYPOINT ["bun", "/app/index.ts"]
