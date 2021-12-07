# API

---
## Account Creation

Step 1:

|Endpoint|/create|
|:-------|------:|
|Method  |POST   |
|Data    |`publicKey` string|

|Response Code|Data|
|:------------|---:|
|200          |<ul><li>`id` 4 hex string</li><li>`sessionToken` 32 hex string</li></ul>|
|400, 500     |None|

---
## Authentication

**Step 1:**

|Endpoint|/auth/1|
|:-------|------:|
|Method  |POST   |
|Data    |`id` 4 hex string|

|Reponse Code |Data|
|:------------|---:|
|200          |<ul><li>`nonce` 32 hex string</li><li>`encryptedFile` base64 string</li></ul>|
|400, 404, 500|None|

**Step 2:**

|Endpoint|/auth/2  |
|:-------|--------:|
|Method  |POST     |
|Data    |<ul><li>`id` 4 hex string</li><li>`nonce` 32 hex string</li><li>`signature` 78 base64 string</li></ul>|

|Response Code     |Data|
|:-----------------|---:|
|200               |`sessionToken` 32 hex string|
|400, 403, 404, 500|None|

## Get a public Key
**The current implementation does not match this spec, and will be updated soon.**

|Endpoint|/getpk/\<crypikID\>|
|:-------|------------------:|
|Method  |GET                |

|Response Code|Data           |
|:------------|--------------:|
|200          |`pubKey` string|
|400,404,500  |None           |

---
## New Chat

|Endpoint|/newChat|
|:-------|-------:|
|Method  |POST    |
|Data    |<ul><li>`sessionToken` 32 hex string</li><li>`members` list of 4 hex string</li><li>`g` bigInt</li><li>`p` bigInt</li><li>`exponents` list of string</li><li>`signature` 78 base64 string</li></ul>|

|Response Code|Data         |
|:------------|------------:|
|200          |`channel` int|
|400, 403, 500|None         |

## Accept Chat

|Endpoint|/acceptChat|
|:-------|----------:|
|Method  |POST       |
|Data    |<ul><li>`sessionToken` 32 hex string</li><li>`channel` int</li><li>`accept` boolean</li><li>`exponents` list of string</li><li>`signature` 78 base64 string</li></ul>|

|Response Code     |Data|
|:-----------------|---:|
|200               |None|
|400, 403, 404, 500|None|

## Find Chat

|Endpoint|/findChat|
|:-------|--------:|
|Method  |POST     |
|Data    |`sessionToken` 32 hex string|

|Response Code|Data|
|:------------|---:|
|200          |List of:<br><ul><li>`channel` int</li><li>`members` list of 4 hex string</li><li>`g` bigInt</li><li>`p` bigInt</li><li>`exponents` list of string</li><li>`signature` 78 base64 string</li></ul>|
|400, 403, 500|None|

---
## Send Message

|Endpoint|/send|
|:-------|----:|
|Method  |POST |
|Data    |<ul><li>`sessionToken` 32 hex string</li><li>`channel` int</li><li>`message` string</li></ul>|

|Response Code     |Data|
|:-----------------|---:|
|200               |None|
|400, 403, 404, 500|None|

## Get Messages

|Endpoint|/retrieve|
|:-------|--------:|
|Method  |POST     |
|Data    |<ul><li>`sessionToken` 32 hex string</li><li>`userTimestamp` timestamp</li></ul>|

|Response Code|Data|
|:------------|---:|
|200          |`messages` list of string|
|400, 404, 500|None|
