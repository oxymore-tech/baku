# Start local instance
-----------------------

### Prerequisites
  - docker
  - docker-compose

### Start baku
```
cp docker-compose.yml.dist docker-compose.yml
docker-compose up -d
```

### Computer connection
- visit `https://localhost:3030`
- ignore certifiacte warnings

### Smartphone connection
- On the computer: get ip `ip a`
- On the smartphone: 
  * connect to the same wifi network as your computer
  * visit `https://<computer_ip>:3030`

# Troubleshooting
-----------------

### Erreur ERR_INVALID_CERTIFICATE
Run chrome/chromium with the parameter `ignore-certificate-errors`
```
chromium -ignore-certificate-errors&
```

# Contribution
--------------

### build front
```
cd front
yarn
yarn build
```
Builded files are in front/dist

### build back
```
cd back
cargo build
cargo run <port>
```

### Front development with Docker-compose
Add the following line in your docker-compose.yml -> services -> proxy -> volumes
```
- "./front/dist:/front_files/"
```
And, instead of using
```
yarn build --watch
```
Use
```
yarn build --watch --no-clean
```
