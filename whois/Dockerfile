FROM alpine:latest

RUN apk add --no-cache whois curl

WORKDIR /

ARG CACHE_BUST

COPY --chmod=755 ./whois/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
