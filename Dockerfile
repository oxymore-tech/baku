FROM gradle:6.2.2-jdk11 AS back-compiler
WORKDIR /app
COPY back/build.gradle back/gradle.properties ./
RUN gradle build --no-daemon
COPY back/ .
RUN gradle assemble --no-daemon

# FROM openjdk:11 AS front-dev
# EXPOSE 8080
# WORKDIR /app
# COPY --from=back-compiler /app/build/libs/app-all.jar .
# CMD ["java", "-jar", "app-all.jar"]

FROM node:13.1.0-stretch AS front-setup
WORKDIR /app
COPY front/package.json \
     front/yarn.lock \
     ./
RUN yarn
COPY front/ .

# FROM front-setup AS front-watcher
# CMD yarn watch

FROM front-setup AS front-compiler
RUN yarn build --release

FROM openjdk:11 AS prod
EXPOSE 8080
WORKDIR /app
COPY ssl . 
COPY --from=back-compiler /app/build/libs/app-all.jar .
COPY --from=front-compiler /app/dist ./dist
CMD ["java", "-jar", "app-all.jar"]


FROM oracle/graalvm-ce:20.0.0-java11 AS exec-builder
WORKDIR /app
RUN gu install native-image
COPY --from=back-compiler /app/build/libs/app-all.jar .
RUN native-image --no-server -cp app-all.jar

FROM frolvlad/alpine-glibc AS native-prod
EXPOSE 80
WORKDIR /app
RUN apk update && apk add libstdc++
COPY --from=exec-builder /app/ .
COPY --from=builder /app/dist ./front_files
ENTRYPOINT ["/app/baku"]
