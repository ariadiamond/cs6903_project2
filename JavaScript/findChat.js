import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { num } from "/JavaScript/num.js";
import { auth } from "/JavaScript/auth.js";

import { ed25519 } from "/JavaScript/Libs/noble-ed25519.js";

const errFind = {
  EAuth:     1,
  FetchFail: 2,
  ServerErr: 3
}

/* findChat 
 *
 * TODO cache public keys for faster verification
 */
async function findChatFun() {
  // in last round, there will be an exponent with a key length(members) - 1
  var token = localStorage.getItem("token");
  if (token == null) {
    return errFind.EAuth;
  }
  
  // connect to server to get available chats
  try {
    var response = await fetch("/findChat", {
      method: "POST",
      body: JSON.stringify({sessionToken: token})
    });
  } catch(e) {
    console.error(e);
    return errFind.FetchFail;
  }
  
  // switch on response
  switch(response.status) {
    case 200:
      var json = await response.json();
      break;
    case 403:
      return errFind.EAuth;
    default:
      return errFind.ServerErr;
  }
  
  /* Iterate through channels and:
   *   - check validity
   *   - create a list of channels that have not yet been accepted
   *   - compute exponents/shared keys for chats we have already accepted
   */
  var acceptList = new Map();
  for (const chan of json) {
    if (!await verify(chan)) {
      console.log("unable to verify channel", chan.channel);
      continue;
    }
    
    var key = encryptedStore.getKey(chan.channel);
    if (typeof key === "number") { // we got an "error": the key does not exist
      acceptList.set(chan.channel, chan);        
    } else { // we have already accepted
      // based on the order of acceptance, we are guaranteed to have the 0th
      // exponent be the one we want
      var preDaddySecret = num.modExp(
        num.parseStr(chan.exponents[0]),
        num.parseStr(key.x),
        num.parseStr(key.p)
      );
      var newExps = new Array();
      for (var i = 1; i < chan.exps.length; i++) {
        var elem = num.modExp(
          num.parseStr(chan.exps[i]),
          num.parseStr(key.x),
          num.parseStr(key.p)
        );
        newExps.push(elem.toString(num.RADIX));
      }
      // sign and send updated exponents back to server
      try {
        var signature = await sign(JSON.stringify({
          from:      localStorage.getItem("id"),
          members:   chan.members,
          g:         chan.g,
          p:         chan.p,
          exponents: newExps
        }));
        // we initialized response with the previous fetch call
        response = await fetch("/acceptChat", {
          method: "POST",
          body: JSON.stringify({
            sessionToken: token,
            channel:      chan.channel,
            accept:       true,
            exponents:    newExps,
            signature:    signature
          })
        });
      } catch(e) {
        return errFind.FetchFail;
      }
      switch(response.status) {
        case 200:
          break;
        case 403: // fallthrough
        case 404:
          return errFind.EAuth;
        default:
          return errFind.ServerErr;
      }
      // provided we were able to store the updated exponents on the server, now
      // let's derive the shared key
      var forDerive = await crypto.subtle.importKey(
        "raw",
        preDaddySecret,
        "HKDF",
        false,
        ["deriveKey"]
      );
      // derive key using HKDF because we have a lot of entropy from DH
      key = await crypto.subtle.deriveKey(
        {name: "HKDF", hash: "SHA-256", salt: new Array(), info: new Array()},
        forDerive,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]
      );
      // store key in encryptedStore
      encryptedStore.setKey(chan.channel, key);
    } // end else
  } // end for (iterate through each channel
  return acceptList;
}

async function sign(msg) {
  const privKey = encryptedStore.getPrivKey();
  const msgHash = await crypto.subtle.digest(
    "SHA-256",
    // convert from string to raw bytes
    new Uint8Array(Array.from(msg).map(d => d.charCodeAt(0)))
  );
  // convert ArrayBuffer (from digest) to raw bytes
  const signature = await ed25519.sign(new Uint8Array(msgHash), privKey);
  // convert signature (raw bytes) to string of base64
  return btoa(String.fromCharCode(...Array.from(signature)));
}

async function verify(chan) {
  // find who sent the message
  var idx = -1;
  for (var i = 0; i < chan.members.length; i++) {
    if (localStorage.getItem("id") === chan.members[i]) {
      idx = (i - 1 + chan.members.length) % chan.members.length;
      break;
    }
  }
  if (idx == -1) {
    return false;
  }
  // get the public key of the sender
  var from = chan.members[idx];
  try {
    var pubKey = await auth.getPK(from);
  } catch(e) {
    console.error(e);
    return false;
  }
  
  // hash and verify the signature for the message
  const msg = JSON.stringify({
    from:      from,
    members:   chan.members,
    p:         chan.p.trim(),
    g:         chan.g.trim(),
    exponents: chan.exponents.map(d => d.trim())
  });
  console.log(msg);
  const msgHash = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(Array.from(msg).map(d => d.charCodeAt(0)))
  );
  // convert signature back to byte representation from base64 string
  var signature = new Uint8Array(Array.from(atob(chan.signature))
    .map(d => d.charCodeAt(0)));
  return await ed25519.verify(signature, new Uint8Array(msgHash), pubKey);
}

export const findChat = {
  err:      errFind,
  findChat: findChatFun
}
