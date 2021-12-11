import { encryptedStore } from "encryptedStorage.js";
import { num } from "num.js";

import * as ed25519 from "ed25519.js";

const errFind = {
  EAuth:     1,
  FetchFail: 2,
  ServerErr: 3
}

async function findChatFun() {
  // in last round, there will be an exponent with a key length(members) - 1
  var token = localStorage.getItem("token");
  if (token == null) {
    return errFind.EAuth;
  }
  try {
    var response = await fetch("/findChat", {
      method: "POST",
      body: JSON.stringify({sessionToken: token})
    });
  } catch(e) {
    return errFind.FetchFail;
  }
  
  switch(response.status) {
    case 200:
      var json = await response.json();
      break;
    case 403:
      return errFind.EAuth;
    default:
      return errFind.ServerErr;
  }
  
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
      var forDerive = await crypto.subtle.importKey(
        "raw",
        preDaddySecret,
        "HKDF",
        false,
        ["deriveKey"]
      );
      key = await crypto.subtle.deriveKey(
        {name: "HKDF", hash: "SHA-256", salt: new Array(), info: new Array()},
        forDerive,
        {name: "AES-GCM", length: 256},
        false,
        ["encrypt", "decrypt"]
      );
      encryptedStore.setKey(key);
    }
  }
}

async function sign(msg) {
  const privKey = encryptedStore.getPrivKey();
  const msgHash = await crypto.subtle.digest("SHA-256", msg);
  const signature = await ed25519.sign(msgHash, privKey);
  return signature;
}

async function verify(chan) {
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
  var from = chan.members[idx];
  try {
    var response = await fetch("/getpk/" + from);
  } catch(e) {
    return false;
  }
  switch(response.status) {
    case 200:
      var json = await response.json();
      break;
    default:
      return false;
  }
  
  const msg = JSON.stringify({
    from:      from,
    members:   chan.members,
    g:         chan.g,
    p:         chan.p,
    exponents: chan.exponents
  });
  const msgHash = await crypto.subtle.digest("SHA-256", msg);
  return await ed25519.verify(chan.signature, msgHash, json.pubKey);
}

export const findChat = {
  err:      errFind,
  findChat: findChatFun
}
