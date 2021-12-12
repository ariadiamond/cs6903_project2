import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { vectorClock } from "/JavaScript/vectorClock.js";
import { num } from "/JavaScript/num.js";
import * as ed25519 from "/JavaScript/Libs/noble-ed25519.js";

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
  var key = {
    p: num.getP(),
    g: num.getG(),
    x: num.getx()
  };
  
  const exps = [num.modExp(key.g, key.x, key.p)];
  
  const msg = Array.from(JSON.stringify({
    from: localStorage.getItem("id"),
    members: members,
    p: key.p,
    g: key.g,
    exponents: exps
  }).map(d => d.charCodeAt(0)));
  const signature = sign(msg);
  
  try {
    var response = await fetch("/newChat", {
      method: "POST",
      body: JSON.stringify({
        sessionToken: token,
        members: members,
        g: key.g,
        p: key.p,
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
      encryptedStore.setKey(channel, key);
      return 0;
    case 403:
      return errNewChat.EAuth;
    default:
      return errNewChat.ServerErr;
  }
}

async function acceptChat(channel, accept, chan) {
  var token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  var body;
  if (accept) {
    // setKey
    var key = {
      g: chan.g,
      p: chan.p,
      x: num.getX()
    };
    encryptedStore.setKey(channel, key);
    vectorClock.initChannel(channel, chan.members)
    var newExps = new Array();
    for (const exponent of channel.exponents) {
      newExps.append(num.modExp(BigInt(exponent), key.x, chan.p).toString());
    }

    const signature = await sign(JSON.stringify({
      from:      localStorage.getItem("id"),
      members:   chan.members,
      g:         chan.g,
      p:         chan.p,
      exponents: newExps
    }));
    body = JSON.stringify({
      sessionToken: token,
      channel:      channel,
      accept:       true,
      exponents:    newExps,
      signature:    signature
    });
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
