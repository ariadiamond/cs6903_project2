import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { num } from "/JavaScript/num.js";
import { auth } from "/JavaScript/auth.js";

import * as ed25519 from "/JavaScript/Libs/noble-ed25519.js";

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
  var acceptList = new Array();
  for (const chan of json) {
    if (!await verify(chan)) {
      continue;
    }
    
    var key = encryptedStore.getKey(chan.channel);
    if (typeof key === "number") { // we got an "error" ie. it does not exist
      acceptList.append(chan);        
    } else { // we have already accepted
      var preDaddySecret = num.modExp(BigInt(chan.exps[0]), key.x, key.p);
      var newExps = new Array();
      for (var i = 1; i < chan.exps.length; i++) {
        var elem = num.modExp(BigInt(chan.exps[i]), key.x, key.p).toString();
        newExps.append(elem);
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
        response = fetch("/acceptChat", {
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
    }
  }
}

async function sign(msg) {
  const privKey = encryptedStore.getPrivKey();
  const msgHash = await crypto.subtle.digest("SHA-256", msg);
  const signature = await ed25519.sign(msgHash, privKey);
  // convert signature to string of base64
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
    var response = await auth.getPK(from);
  } catch(e) {
    return false;
  }
  
  // hash and verify the signature for the message
  const msg = JSON.stringify({
    from:      from,
    members:   chan.members,
    g:         chan.g,
    p:         chan.p,
    exponents: chan.exponents
  });
  const msgHash = await crypto.subtle.digest(
    "SHA-256", 
    new Uint8Array(Array.from(msg).map(d => d.charCodeAt(0)))
  );
  // convert signature back to byte representation from base64
  var signature = new Uint8Array(Array.from(atob(chan.signature))
    .map(d => d.charCodeAt(0))); 
  return await ed25519.verify(signature, msgHash, response);
}

export const findChat = {
  err:      errFind,
  findChat: findChatFun
}
