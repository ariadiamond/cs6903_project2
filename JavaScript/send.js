// my imports
import { encryptedStore } from "/JavaScript/encryptedStorage.js";

// imports to external libraries
import * as ed25519 from "/JavaScript/Libs/ed25519.js";

// errors possible from sendMessage
/* export */ const errSend = {
  NoToken:   1,
  NoKey:     2,
  FetchFail: 3,
  Denied:    4,
  NExist:    5,
  ServerErr: 6
};

/* sendMessage is an asynchronous function that handles the entire process of
 * encrypting, signing, and sending a message to a channel.
 */
/* export */ async function sendMessage(channel, message) {
  var token = localStorage.getItem("token");
  if (token == null) {
    return errSend.NoToken;
  }
    
  var vectorClock = encryptedStore.incGetClock(channel);
  
  // encrypt message + vc
  var encData = await encrypt(channel, vectorClock, message);
  if (typeof encData === "number") { // check if we had an error
    return encData;
  }
  var {iv, encryptedData} = encData; // destructure data from correct execution
  
  // sign message with enough data that it cannot be reused
  var signature = await sign(channel, iv, encryptedData);
  
  // do actual fetch call (send data to server)
  try {
    var resp = await fetch("/send", {
      method: "POST",
      body: JSON.stringify({
        "sessionToken": token,
        "channel":      channel,
        "iv":           iv,
        "message":      encryptedData,
        "signature":    signature
      })
    });
  } catch(e) {
    return errSend.FetchFail;
  }
  
  // return response based on how the server handled it
  switch(resp.status) {
    case 200:
      return 0;
    case 403:
      return errSend.Denied;
    case 404:
      return errSend.NExist;
    default:
      return errSend.ServerErr;    
  }
}

/* encrypt is a helper function that encrypts the message and vector clock with
 * AES256-GCM with the key from the channel. If there is an error (the channel
 * key does not exist, we return a number, but otherwise we return the iv and
 * encrypted data.
 */
async function encrypt(channel, vectorClock, message) {
  // Get the channel key type CryptoKey if it exists, or null if none exists.
  // In the case of no channel key, we return a number error.
  const channelKey = encryptedStore.getKey(channel);
  if (channelKey == null) {
    return errSend.NoKey;
  }
  
  // generate an iv
  var iv = window.crypto.getRandomValues(new Uint8Array(96 >> 3));
  // generate the gcm object
  const gcmObj = {
    name: "AES-GCM",
    iv:   iv
  };
  
  // convert the message and vector clock into data that can be encrypted.
  // first it converts it to a JSON object, then into an array and finally
  // mutates it into ascii character codes
  const plaintext = Array.from(JSON.stringify({
    "vectorClock": vectorClock,
    "message":     message
  })).map(d => d.charCodeAt(0));
  
  // do the actual encryption
  const encryptData = await window.crypto.subtle.encrypt(gcmObj,
    channelKey, plaintext);
  
  // convert the data to base64 and return it
  return {"iv": iv, "encryptedData": encryptData}; // encode binary in base64

}

/* sign takes enough data to create a unique signature that cannot be reused on
 * a different message. This is because the vector clock (included in
 * "encryptedData" will need to be different in order to not be discarded for
 * being a replay, and iv needs to be different for security purposes. It
 * returns the signature, but currently can cause exceptions if either hashing
 * or signing fails.
 */
async function sign(channel, iv, encryptedData) {
  // encode all data into a JSON object and convert it to an array of ints based
  // on the ascii character codes.
  var messageData = Array.from(
    JSON.stringify({
      "from":    localStorage.getItem("id"),
      "channel": channel,
      "iv":      iv,
      "message": encryptedData
    })).map(d => d.charCodeAt(0));
  // hash and sign message
  var msgHash   = await window.crypto.subtle.digest("SHA-256", messageData);
  
  // get privKey
  const privKey = localStorage.getItem("privKey");
  var signature = await ed25519.sign(msgHash, privKey);
  return signature;
}
