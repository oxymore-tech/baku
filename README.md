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
- visit `https://localhost`
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

### Front development
Add the following line in your docker-compose.yml -> services -> proxy -> volumes
```
- "./front/dist:/front_files/"
```
Build:
```
cd front
yarn
yarn build --watch --no-clean
```

### Back development
Add the following line in your docker-compose.yml -> services -> proxy -> environment
```
- "- BACK_URI=https://localhost:3000"
```
Run back on port 3000:
```
cd back
cargo run 3000
```
