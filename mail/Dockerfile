FROM node:22-trixie-slim AS wraps-builder

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apt install -y git
RUN npm install -g pnpm@latest-10

WORKDIR /builder

ARG CACHE_BUST

RUN git clone https://github.com/wraps-team/wraps.git wraps

WORKDIR /builder/wraps

RUN pnpm install --frozen-lockfile --include=dev
RUN pnpm --filter @wraps/core build
RUN pnpm --filter @wraps/email-check build

FROM oven/bun:alpine

ARG NODE_ENV=production
ARG CACHE_BUST
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY ./mail /app
COPY ./types.d.ts /app/types.d.ts
COPY --from=wraps-builder /builder/wraps /app/

ENTRYPOINT ["bun", "/app/index.ts"]