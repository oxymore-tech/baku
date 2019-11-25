FROM node:13.1.0-stretch AS front-builder
WORKDIR /app
COPY front/package.json \
     front/package-lock.json \
     ./
RUN yarn install
COPY front/ .
RUN yarn build --release


FROM rust:1.39.0 AS back-builder
WORKDIR /app
COPY back/Cargo.toml \
     back/Cargo.lock \
     back/rust-toolchain \
     ./
RUN mkdir src && \
    echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs && \
    cargo build --release && \
    rm -f target/release/deps/bakuanimation*
COPY back/src/ src/
RUN cargo build --release


FROM debian:stable
EXPOSE 3030
VOLUME /app/data/ /app/certificates/
WORKDIR /app
COPY ./certificates ./certificates
COPY --from=front-builder /app/dist ./front_files
COPY --from=back-builder /app/target/release/bakuanimation .
CMD ./bakuanimation
