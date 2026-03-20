FROM alpine:latest

RUN apk add --no-cache whois curl

WORKDIR /

ARG CACHE_BUST

COPY ./whois/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]