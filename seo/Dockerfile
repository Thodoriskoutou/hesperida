FROM node:22-trixie-slim

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npm install -g @seomator/seo-audit \
    && npx playwright install chromium --with-deps

RUN apt install -y jq curl

RUN rm -rf /var/lib/apt/lists/*

# prewarm browser
RUN find /ms-playwright -name chrome -type f -exec {} \
    --headless --no-sandbox --disable-gpu --dump-dom about:blank \; \
 || true

ARG CACHE_BUST

COPY ./seo/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]