FROM node:13.1.0-stretch AS front-builder
WORKDIR /app
COPY front/package* ./
RUN yarn install
COPY front/ .
RUN yarn build --release


FROM rust:1.39.0 AS back-builder
WORKDIR /app
COPY back/rust-toolchain \
     back/Cargo.toml \
     back/Cargo.lock \
     ./
RUN mkdir src && \
    echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs && \
    cargo build --release && \
    rm -f target/release/deps/bakuanimation*
COPY back/src/ src/
RUN cargo build --release


FROM alpine
# FROM debian
EXPOSE 443
VOLUME /app/certificates/
WORKDIR /app
COPY --from=front-builder /app/dist ./front_files
COPY --from=back-builder /app/src/tls ./certificates
COPY --from=back-builder /app/target/release/bakuanimation .
CMD ./back/bakuanimation
