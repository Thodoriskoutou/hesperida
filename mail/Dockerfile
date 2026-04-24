FROM node:22-trixie-slim AS wraps-builder

WORKDIR /builder

RUN apt-get update \
    && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@latest-10

RUN git clone -b hesperida-v0.10.0 --single-branch https://github.com/rallisf1/wraps.git wraps

WORKDIR /builder/wraps

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @wraps/core build
RUN pnpm --filter @wraps/email-check build

FROM oven/bun:alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY ./mail/package.json ./mail/bun.lock /app/

RUN bun install --frozen-lockfile --production --omit=peer

ARG CACHE_BUST

COPY ./mail /app
COPY ./types.d.ts /app/types.d.ts
COPY --from=wraps-builder /builder/wraps/packages/email-check/dist /app/wraps/packages/email-check/dist

ENTRYPOINT ["bun", "/app/index.ts"]
