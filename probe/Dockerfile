FROM projectdiscovery/httpx:latest

RUN apk add jq curl

ARG CACHE_BUST

COPY ./probe/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]