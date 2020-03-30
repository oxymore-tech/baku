######################
# Become a Certificate Authority
######################

NAME=localhost
FILENAME=server
IP=127.0.0.1
PASSWORD=GHsLvjmDiAYrpao9
DN_COUNTRY=FR
DN_STATE=Occitanie
DN_CITY=Toulouse
DN_ORG=LaRuche
DN_COMMONNAME=Baku

# Generate private key
openssl genrsa -des3 -out myCA.key -passout pass:$PASSWORD 2048 

# Generate root certificate
openssl req -x509 -new -nodes -key myCA.key -sha256 -days 1825 -out myCA.pem  -passin pass:$PASSWORD  \
    -subj "/C=$DN_COUNTRY/ST=$DN_STATE/L=$DN_CITY/O=$DN_ORG/CN=$DN_COMMONNAME"

######################
# Create CA-signed certs
######################

# Generate private key
[[ -e $FILENAME.key ]] || openssl genrsa -out $FILENAME.key 2048
# Create certificate-signing request
[[ -e $FILENAME.csr ]] || openssl req -new -key $FILENAME.key -out $FILENAME.csr   -subj "/C=$DN_COUNTRY/ST=$DN_STATE/L=$DN_CITY/O=$DN_ORG/CN=$DN_COMMONNAME"

# Create a config file for the extensions
>$FILENAME.ext cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = $NAME
DNS.2 = $IP
EOF

# Create the signed certificate
openssl x509 -req -in $FILENAME.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial \
    -out $FILENAME.crt -days 1825 -sha256 -extfile $FILENAME.ext -passin pass:$PASSWORD

# Create pkcs12 file for the Java server
openssl pkcs12 -export -out $FILENAME.pkcs12 -in $FILENAME.crt -inkey $FILENAME.key -passout pass:$PASSWORD