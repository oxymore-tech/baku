#!/usr/bin/env bash

BASEDIR=$(dirname "$0")

DOMAIN=app.bakuanimation.com
EMAIL=augustin.gjini@pm.me

if [[ ! -f ${BASEDIR}/certbot ]]; then
    mkdir -p ${BASEDIR}/certbot
fi

certbot certonly \
		--agree-tos \
		--domains "app.bakuanimation.com" \
		--email "augustin.gjini@pm.me" \
		--expand \
		--noninteractive \
		--webroot \
		--webroot-path ${BASEDIR}/certbot || true
