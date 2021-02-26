#!/bin/bash

BAKU_HOME=/home/lamenagerie/baku

docker-compose down

# docker run -ti -p 80:80 -v ${BAKU_HOME}/letsencrypt:/etc/letsencrypt certbot/certbot certonly --standalone --email support@bakuanimation.com -d studio.bakuanimation.com
docker run -ti -p 80:80 -v ${BAKU_HOME}/letsencrypt:/etc/letsencrypt certbot/certbot certonly --renew-by-default -d studio.bakuanimation.com

echo Enter password ?

password=$(read)

sudo openssl pkcs12 -export -out ${BAKU_HOME}/letsencrypt/server.pkcs12 -in ${BAKU_HOME}/letsencrypt/live/studio.bakuanimation.com/fullchain.pem -inkey ${BAKU_HOME}/letsencrypt/live/studio.bakuanimation.com/privkey.pem -passout pass:${password}

docker-compose up -d
