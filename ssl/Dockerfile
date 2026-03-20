FROM oven/bun:alpine

WORKDIR /app

ARG CACHE_BUST

COPY ./ssl /app
COPY ./types.d.ts /app/types.d.ts

RUN bun install

ENTRYPOINT ["bun", "/app/index.ts"]