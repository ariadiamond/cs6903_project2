<div class="lecture">

# API

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
