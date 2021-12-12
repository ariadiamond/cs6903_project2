# Cryptik

|Adam Gordon|Aria Diamond|Ender Gottipati|Gabriella Vega|
|-----------|------------|---------------|--------------|

## Overview

Project repository for CS-GY 6903 project 2. We are building a secure system allowing for
anonymous messaging called Cryptik. This is type 1 of project 2.

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
