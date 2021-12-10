import { encryptedStore } from "encryptedStorage.js";
import * as ed25519 from "noble-ed25519.js";

const errNewChat = {
  EAuth:     1,
  FetchFail: 2,
  ServerErr: 3,
  NExist:    4
};


async function createChat(members) {
  const token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  
  const p = num.getBigPrime();
  const g = num.getG();
  
  const x = num.getx();
  
  const exps = ["a:" + x];
  
  const msg = Array.from(JSON.stringify({p: p, g: g, exponents: exps})
    .map(d => d.charCodeAt(0)));
  const signature = sign(msg);
  
  try {
    var response = await fetch("/newChat", {
      method: "POST",
      body: JSON.stringify({
        sessionToken: token,
        members: members,
        g: g,
        p: p,
        exponents: exps,
        signature: signature}) 
    });
  } catch(e) {
    return errNewChat.FetchFail;
  }
  switch (response.status) {
    case 200:
      try {
        var json = await response.json();
        var channel = json.channel;
      } catch(e) {
        return errNewChat.ServerErr;
      }
      encryptedStore.setKey(channel, {g: g, p: p, exponents: exps})
      return 0;
    case 403:
      return errNewChat.EAuth;
    default:
      return errNewChat.ServerErr;
  }
}

async function acceptChat(channel, accept, members) {
  var token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  var body;
  if (accept) {
    // TODO exponents
    // for exp in exps
    //   exp = exp ^ x mod p
    // exps += g ^ x mod p
    
  } else { // we are not joining the chat
    const msg = JSON.stringify({
      id: localStorage.getItem("id"),
      accept: false,
      channel: channel
    });
    const signature = sign(msg);
    body = JSON.stringify({
      sessionToken: token,
      exponents: [""],
      signature: signature
    });
  }
  
  try {
    var response = await fetch("/acceptChat", {
      method: "POST",
      body: body
    });
  } catch(e) {
    return errNewChat.FetchFail;
  }
  switch (response.status) {
    case 200:
      return 0;
    case 403:
      return errNewChat.EAuth;
    case 404:
      return errNewChat.NExist;
    default:
      return errNewChat.ServerErr;
  }
}


async function sign(msg) {
  const privKey = encryptedStore.getPrivKey();
  const msgHash = await crypto.subtle.digest("SHA-256", msg);
  const signature = await ed25519.sign(msgHash, privKey);
  return btoa(signature.toString());
}

export const newChat = {
  errNewChat: errNewChat,
  createChat: createChat,
  acceptChat: acceptChat  
};
