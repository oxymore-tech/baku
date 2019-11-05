
# 1) start front
```
cd front
yarn
yarn build
```

Builed files are in front/dist

# 2) start back
```
cd back
cargo run
```


# Troubleshooting

## Erreur ERR_INVALID_CERTIFICATE
Run chrome/chromium with the parameter `ignore-certificate-errors`
```
chromium -ignore-certificate-errors&
```
