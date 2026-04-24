FROM oven/bun:alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY ./ssl/package.json ./ssl/bun.lock /app/

RUN bun install --frozen-lockfile --production --omit=peer

ARG CACHE_BUST

COPY ./ssl /app
COPY ./types.d.ts /app/types.d.ts

ENTRYPOINT ["bun", "/app/index.ts"]
