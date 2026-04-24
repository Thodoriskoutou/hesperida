FROM projectdiscovery/httpx:latest

RUN apk add --no-cache jq curl

ARG CACHE_BUST

COPY --chmod=755 ./probe/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
