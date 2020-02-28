FROM node:13.1.0-stretch AS setup
WORKDIR /app
COPY package.json \
     yarn.lock \
     ./
RUN yarn
COPY . .


FROM setup AS watcher
CMD yarn watch


FROM setup AS builder
RUN yarn build --release


FROM nginx

RUN apt-get update && \
    apt-get install -y gettext

COPY proxy/nginx.conf /etc/nginx/nginx.conf.tmpl
COPY proxy/ssl /ssl
COPY --from=builder /app/dist /front_files

ENV BACK_URI=http://back:3030

WORKDIR /etc/nginx
CMD envsubst '$BACK_URI' < nginx.conf.tmpl > nginx.conf && \
    nginx -g "daemon off;"
