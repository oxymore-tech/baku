#!/usr/bin/env bash

BASEDIR=$(dirname "$0")

DOMAIN=app.bakuanimation.com
EMAIL=augustin.gjini@pm.me

mkdir -p ${BASEDIR}/certbot/conf
mkdir -p ${BASEDIR}/certbot/www

certbot certonly \
        --config-dir "${BASEDIR}/certbot/conf" \
		--agree-tos \
		--domains "app.bakuanimation.com" \
		--email "augustin.gjini@pm.me" \
		--expand \
		--noninteractive \
		--webroot \
		--webroot-path ${BASEDIR}/certbot/www || true
