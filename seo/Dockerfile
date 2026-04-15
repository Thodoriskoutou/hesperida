FROM bun:1-slim

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npm install -g @seomator/seo-audit \
    && npx playwright install chromium --with-deps

RUN apt install -y git

RUN rm -rf /var/lib/apt/lists/*

# prewarm browser
RUN find /ms-playwright -name chrome -type f -exec {} \
    --headless --no-sandbox --disable-gpu --dump-dom about:blank \; \
 || true

WORKDIR /app

ARG CACHE_BUST

# TODO: git clone https://github.com/seo-skills/seo-audit-skill.git and build it

COPY ./seo /app

RUN bun install

ENTRYPOINT ["bun", "/app/index.ts"]