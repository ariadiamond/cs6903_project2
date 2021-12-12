import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { vectorClock } from "/JavaScript/vectorClock.js";
import * as ed25519 from "/JavaScript/Libs/noble-ed25519.js";

const errRecv = {
  EAuth:       1,
  FetchFail:   2,
  ServerErr:   3,
  NExist:      4,
  ChanNotInit: 5
}


async function recieveMessages() {
  const token = localStorage.getItem("token");
  const timeNow = encryptedStore.getTimeStamp();
  if (token == null || timeNow == null) {
    return errRecv.EAuth;
  }
  
  const updateTime = Date.now();
  try {
    var response = await fetch("/retrieve", {
      method: "POST",
      body: JSON.stringify({sessionToken: token, userTimestamp: timeNow})
    });
  } catch(e) {
    return errRecv.FetchFail;
  }
  
  switch(response.status) {
    case 200: // :)
      break;
    case 404:
      return errRecv.EAuth;
    default:
      return errRecv.ServerErr;
  }
  
  var json = await response.json();
  for (const message of json.messages) {
    const valid = await verify(
      JSON.stringify({
        from: message.from,
        channel: message.channel,
        iv: message.iv,
        message: message.message
      }),
      message.from
    );
    if (typeof valid === "number" || !valid) {
      return valid;
    }
    var data = decrypt(message.channel, message.iv, message.message);
    if (typeof data == "number") {
      return data;
    }
    vectorClock.deliver(
      message.from,
      message.channel,
      data.vectorClock,
      data.message);
  }
  encryptedStore.setTimestamp(updateTime);
  return 0;
}

async function verify(msg, from) {
  // get public key
  try {
    var response = fetch("/getpk/" + from);
  } catch(e) {
    return errRecv.FetchFail;
  }
  
  switch (response.status) {
    case 200:
      var json = await response.json();
      break;
    case 404:
      return errRecv.NExist;
    default:
      return errRecv.ServerErr;
  }
  // verify authenticity of public key by signature from server?
  
  // verify signature of message
  const msgHash = await crypto.subtle.digest("SHA-256", Array.from(msg
    .map(d => d.charCodeAt(0))));
  return await ed25519.verify(msgHash, json.pubKey);  
}


async function decrypt(channel, iv, encryptedData) {
  // get shared key
  const key = encryptedStore.getKey(channel);
  if (key?.g != null) {
    return errRecv.ChanNotInit;
  }
  
  // decrypt
  const decrypted = await crypto.subtle.decrypt(
    {name: "AES-GCM", iv: iv},
    key,
    encryptedData);
  
  // convert back to an object with vector clock and message fields
  return JSON.parse(decrypted.toString());
}

export const recieve = {
  err:     errRecv,
  recieve: recieveMessages
}
