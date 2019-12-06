FROM rust:1.39.0 AS builder
WORKDIR /app
COPY ./Cargo.toml \
     ./Cargo.lock \
     ./rust-toolchain \
     ./
RUN mkdir src && \
    echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs && \
    cargo build --release && \
    rm -f target/release/deps/bakuanimation*
COPY ./src/ src/
RUN cargo build --release


FROM debian:stable
EXPOSE 3030
VOLUME /app/data/
RUN apt-get update && \
    apt-get install -y moreutils
WORKDIR /app
COPY --from=builder /app/target/release/bakuanimation .
CMD ./bakuanimation | ts '[%Y-%m-%d %H:%M:%S]'
