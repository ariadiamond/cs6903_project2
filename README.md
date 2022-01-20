# Cryptik

|Adam Gordon|Aria Diamond|Ender Gottipati|Gabriella Vega|
|-----------|------------|---------------|--------------|

## Overview

Project repository for CS-GY 6903 project 2. We are building a secure system allowing for anonymous messaging called Cryptik. This is type 1 of project 2.

For an in-depth analysis of the security of the project, look at [Design.pdf](Design.pdf) in this repository, or see the [overleaf document](https://www.overleaf.com/read/xztpfjbjchbn) which includes the source for building the pdf.

## Building and Running

This requires docker and a x509 certificate key pair. Docker can be found at [the official website](https://www.docker.com) and creating a TLS key pair using openSSL can be found from [this IBM guide](https://www.ibm.com/docs/en/api-connect/5.0.x?topic=profiles-generating-self-signed-certificate-using-openssl).

Place a certificate in `ServerSrc` with the names `cert.pem` and `key.pem` and another (or the same certificate) in `ServerSrc/Postgres/` `server.crt` and `server.key`.

Once these are installed run the following commands:

```bash
# Create a docker subnet so the server and postgres instance can communicate
docker network create --subnet 10.10.0.0/24 dockernet

# Build dockerfile
docker build -t server -f ServerSrc/Dockerfile .
# Build/setup postgres
docker build -t pgi ServerSrc/Postgres/

# Run docker containers
docker run -d --net dockernet --ip 10.10.0.2 pgi
docker run --net dockernet --ip 10.10.0.4 -p 5432:5432 server

```

From this you visit [https://localhost:4443/Visual/cryptikSignUp.html](https://localhost:4443/Visual/cryptikSignUp.html) to use Cryptik.

## Limitations

Being a scripting language and our time contraints not allowing for creating native bindings, our software is vulnerable to timing attacks, especially the key generation for new chats. 

## Sources
- [Askfm](https://ask.fm): our inspiration.

### Golang
- [Go homepage](https://go.dev)
- [Golangci-lint](https://golangci-lint.run) a linter for Golang

### PostgreSQL
- [Docker container](https://hub.docker.com/_/postgres)
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Server configuration](https://www.postgresql.org/docs/current/runtime-config.html)

### JavaScript
- [MDN: Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: Subtle Crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
- [MDN: Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp)
- [MDN: export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- [MDN: fetch()](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

#### Libaries
- [noble-ed25519](https://github.com/paulmillr/noble-ed25519). [Licenced](https://github.com/paulmillr/noble-ed25519/blob/main/LICENSE) under MIT from Paul Miller.
- [ESlint](https://eslint.org) for linting JavaScript
