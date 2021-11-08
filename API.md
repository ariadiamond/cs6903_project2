<div class="lecture">

# API

## Account Creation

Step 1:

|Endpoint|/create|
|Method  |GET    |

Returns cryptik id temporary session cookie to set passsword

Step 2:

|Endpoint|/setpassword|
|Method  |POST        |
|Data    |<ul><li>password</li><li>session cookie</li></ul>|

server hashes password and stores it.

## Authentication

1. Client asks for challenge (by identifying themself)/gets challenge
2. Client solves challenge and sends it?/gets session cookie

**Step 1:**

|Endpoint|/auth/1|
|:-------|------:|
|Method  |POST   |
|Data    |id     |

**Step 2:**

|Endpoint|/auth/2  |
|:-------|--------:|
|Method  |POST     |
|Data    |challenge|

## Send Message

|Endpoint|/send|
|:-------|----:|
|Method  |POST |
|Data    |<ul><li>To</li><li>From</li><li>Message</li></ul>|

## Get Messages

|Endpoint|/retrieve|
|:-------|--------:|
|Method  |GET      |
|Data    |Cookie   |

</div> <!-- End Lecture -->
