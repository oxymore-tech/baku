#!/bin/bash

docker-compose down

docker run -ti -v letsencrypt:/etc/letsencrypt certbot/certbot certonly --standalone --email support@bakuanimation.com -d bakuanimation.com,studio.bakuanimation.com

echo Enter password ?
PWD=$(read)

sudo openssl pkcs12 -export -out letsencrypt/server.pkcs12 -in letsencrypt/letsencrypt/live/app.bakuanimation.com/fullchain.pem -inkey letsencrypt/letsencrypt/live/app.bakuanimation.com/privkey.pem -passout pass:${PWD}

docker-compose up -d
