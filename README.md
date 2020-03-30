# Start local instance

### Prerequisites
  - [docker](https://docs.docker.com/install/)
  - [docker-compose](https://docs.docker.com/compose/install/)

### Start baku
```
cp docker-compose.override.yml.dist docker-compose.override.yml
docker-compose up -d
```

### SSL
```
openssl pkcs12 -export -out server.pkcs12 -in server.cert -inkey server.key -passout pass:toto
```
#### TODO
- Make a clean process

### Generate local certificate

(Source: https://stackoverflow.com/questions/7580508/getting-chrome-to-accept-self-signed-localhost-certificate/43666288)
- Go to ssl directory and run `generate-local-ssl.sh` (checkout for the password inside)
```
./generate-local-ssl.sh
```
- Import the authority certificate `myCA.pem` as an Authority in your Chrome settings (Settings > Manage certificates > Authorities > Import)
- Rebuild the app
```
docker-compose up -d --build
```
#### To remove the CA Authority
- In your Chrome settings (Settings > Manage certificates > Authorities), look for org-LaRuche and remove it

#### TODO
- Voir pour commiter ou ignorer les fichiers de certification

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
