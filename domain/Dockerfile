FROM oven/bun:alpine

RUN apk add --no-cache whois

WORKDIR /app

COPY ./domain /app

COPY ./constants.ts /app/constants.ts
COPY ./types.d.ts /app/types.d.ts

RUN bun install

ENTRYPOINT ["bun", "/app/index.ts"]