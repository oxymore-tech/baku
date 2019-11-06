
# 1) start front
```
cd front
yarn
yarn build
```

Builded files are in front/dist

# 2) start back
```
cd back
cargo run
```


# 3) Test
- On computer, go to `https://localhost:3030`
- Get your computer local ip (`ifconfig`)
- On Smartphone, go to `https://YOUR_IP:3030`

# Troubleshooting

## Erreur ERR_INVALID_CERTIFICATE
Run chrome/chromium with the parameter `ignore-certificate-errors`
```
chromium -ignore-certificate-errors&
```
