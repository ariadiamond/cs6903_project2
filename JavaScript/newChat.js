import { encryptedStore } from 'encryptedStorage.js';
import * as ed25519 from 'noble-ed25519.js';

const errNewChat = {
  EAuth: 1,
  FetchFail: 2,
  ServerErr: 3
};

async function createChat(members) {
  const token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  
  const p = getBigPrime();
  const g = getG(p);
  
  const x = getx();
  
  const exps = ["a:" + x];
  
  const signature = sign(p, g, exps);
  
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

async function sign(p, g, exps) {
  const privKey = encryptedStore.getPrivKey();
  const msg = Array.from(JSON.stringify({p: p, g: g, exponents: exps})
    .map(d => d.charCodeAt(0)));
  const msgHash = await crypto.subtle.digest("SHA-256", msg);
  const signature = await ed25519.sign(msgHash, privKey);
  return btoa(signature);
}

export const newChat = {
  errNewChat: errNewChat,
  createChat: createChat  
};
