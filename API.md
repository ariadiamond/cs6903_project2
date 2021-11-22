# API

## Account Creation

Step 1:

|Endpoint|/create|
|:-------|------:|
|Method  |GET    |

Returns CryptikID temporary session cookie to set passsword

Step 2:

|Endpoint|/setpassword|
|:-------|-----------:|
|Method  |POST        |
|Data    |<ul><li>password</li><li>session cookie</li></ul>|

|Response Code|Data|
|:------------|---:|
|200          |<ul><li>CryptikID</li><li>Session token</li></ul>
|400          |None|
|500          |None|

## Authentication

1. Client asks for challenge (by identifying themself)/gets challenge
2. Client solves challenge and sends it?/gets session cookie

**Step 1:**

|Endpoint|/auth/1|
|:-------|------:|
|Method  |POST   |
|Data    |id     |

|Reponse Code|Data|
|:-----------|---:|
|200         |Nonce, encrypted secret file|
|400         |None|
|404         |None|

**Step 2:**

|Endpoint|/auth/2  |
|:-------|--------:|
|Method  |POST     |
|Data    |challenge|

|Response Code|Data|
|:------------|---:|
|200          |Session token|
|403          |None|

## Get a public Key

|Endpoint|/getpk/\<crypikID\>|
|:-------|------------------:|
|Method  |GET                |

|Response Code|Data              |
|:------------|-----------------:|
|200          |Public Key of user|
|404          |None              |

## Send Message

|Endpoint|/send|
|:-------|----:|
|Method  |POST |
|Data    |<ul><li>To</li><li>Encrypted Message</li></ul>|

|Response Code|Meaning|
|:------------|------:|
|200          |Success|
|403          |Not authenticated|
|404          |Chat does not exist|

## Get Messages

|Endpoint|/retrieve|
|:-------|--------:|
|Method  |GET      |
|Data    |Cookie   |
