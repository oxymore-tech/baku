FROM gradle:6.2.2-jdk11 AS compiler

WORKDIR /app/baku

COPY build.gradle gradle.properties ./

RUN gradle build --no-daemon

COPY . .

RUN gradle assemble --no-daemon


FROM openjdk:11 AS dev

EXPOSE 8080

WORKDIR /app/baku

COPY --from=compiler /app/baku/build/libs/baku-all.jar .

CMD ["java", "-jar", "baku-all.jar"]


FROM oracle/graalvm-ce:20.0.0-java11 AS exec-builder
RUN gu install native-image

WORKDIR /app/baku

COPY --from=compiler /app/baku/build/libs/baku-all.jar .

RUN native-image --no-server -cp baku-all.jar


FROM frolvlad/alpine-glibc AS native

RUN apk update && apk add libstdc++

EXPOSE 8080

COPY --from=exec-builder /app/baku/baku /baku/baku

ENTRYPOINT ["/baku/baku"]
