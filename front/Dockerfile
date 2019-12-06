FROM node:13.1.0-stretch AS builder
WORKDIR /app
COPY package.json \
     yarn.lock \
     ./
RUN yarn
COPY . .
RUN yarn build --release


FROM nginx

VOLUME /data/

RUN apt-get update && \
    apt-get install -y gettext

COPY proxy/nginx.conf /etc/nginx/nginx.conf.tmpl
COPY proxy/ssl /ssl
COPY --from=builder /app/dist /front_files

ENV BACK_URI=http://back:3030

WORKDIR /etc/nginx
CMD envsubst '$BACK_URI' < nginx.conf.tmpl > nginx.conf && \
    nginx -g "daemon off;"
