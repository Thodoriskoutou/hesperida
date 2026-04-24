FROM oven/bun:alpine

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY ./orchestrator/package.json ./orchestrator/bun.lock /app/

RUN bun install --frozen-lockfile --production --omit=peer

ARG CACHE_BUST

COPY ./orchestrator /app
COPY ./constants.ts /app/constants.ts
COPY ./types.d.ts /app/types.d.ts
COPY ./notifications /notifications

RUN mkdir /tools \
    && ln -s /app/constants.ts /tools/constants.ts \
    && ln -s /app/types.d.ts /tools/types.d.ts

ENTRYPOINT ["bun", "/app/index.ts"]
