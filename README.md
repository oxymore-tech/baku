# Start local instance

### Prerequisites
  - [docker](https://docs.docker.com/install/)
  - [docker-compose](https://docs.docker.com/compose/install/)

### Start baku
```
cp docker-compose.yml.dist docker-compose.yml
docker-compose up -d
```

### SSL
TODO: make a clean process
```
openssl pkcs12 -export -out server.pkcs12 -in server.cert -inkey server.key -passout pass:toto
```

### Computer connection
- visit <https://localhost>
- ignore certifiacte warnings

### Smartphone connection
- On the computer: get ip `ip a`
- On the smartphone: 
  * connect to the same wifi network as your computer
  * visit `https://<computer_ip>:3030`

# Troubleshooting

### Erreur ERR_INVALID_CERTIFICATE
Run chrome/chromium with the parameter `ignore-certificate-errors`
```
chromium -ignore-certificate-errors&
```

# Contribution

### Front development
Build & Run :
```
./start-dev.sh
```
Lint:
```
cd front
yarn lint
```

### Back development
Add the following line in your docker-compose.yml -> services -> proxy -> environment
```
- BACK_URI=https://localhost:3000
```
Run back on port 3000:
```
cd back
cargo run 3000
```
