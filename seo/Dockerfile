FROM node:22-trixie-slim AS seomator-builder

WORKDIR /builder

RUN apt-get update \
    && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone -b hesperida-v0.6.0 --single-branch https://github.com/rallisf1/seo-audit-skill.git seomator

WORKDIR /builder/seomator

RUN npm ci \
    && npm run build \
    && npm prune --omit=dev

FROM node:22-trixie-slim

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx playwright install chromium --with-deps \
    && rm -rf /var/lib/apt/lists/*

# prewarm browser
RUN find /ms-playwright -name chrome -type f -exec {} \
    --headless --no-sandbox --disable-gpu --dump-dom about:blank \; 2>/dev/null \
 || true

WORKDIR /app

COPY ./seo/package*.json /app/

RUN npm ci --omit=dev

ARG CACHE_BUST

COPY ./seo /app

COPY --from=seomator-builder /builder/seomator/dist /app/seomator/dist
COPY --from=seomator-builder /builder/seomator/node_modules /app/seomator/node_modules

ENTRYPOINT ["node", "/app/index.js"]
