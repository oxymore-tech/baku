FROM gradle:6.2.2-jdk11 AS back-compiler
WORKDIR /app
COPY back/build.gradle back/gradle.properties ./
COPY .git/ ./.git/
RUN gradle build --no-daemon
COPY back/ .
RUN gradle assemble --no-daemon

FROM node:13.1.0-stretch AS front-setup
WORKDIR /app
COPY front/package.json \
     front/yarn.lock \
     ./
RUN yarn
COPY front/ .

FROM front-setup AS front-watcher
CMD yarn watch

FROM front-setup AS front-compiler
RUN yarn build --release

FROM openjdk:11 AS app
EXPOSE 80 443
WORKDIR /app
COPY ssl ssl
COPY --from=back-compiler /app/build/libs/app-all.jar .
COPY --from=front-compiler /app/dist ./dist
CMD ["java", "-jar", "app-all.jar"]


FROM oracle/graalvm-ce:20.0.0-java11 AS exec-builder
WORKDIR /app
RUN gu install native-image
COPY --from=back-compiler /app/build/libs/app-all.jar .
RUN native-image --no-server -cp app-all.jar

FROM frolvlad/alpine-glibc AS native-app
EXPOSE 80
WORKDIR /app
RUN apk update && apk add libstdc++
COPY ssl ssl
COPY --from=exec-builder /app/ .
COPY --from=front-compiler /app/dist ./dist
ENTRYPOINT ["/app/baku"]
