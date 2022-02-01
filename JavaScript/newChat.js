import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { vectorClock } from "/JavaScript/vectorClock.js";
import { num } from "/JavaScript/num.js";
import { ed25519 } from "/JavaScript/Libs/noble-ed25519.js";

const errNewChat = {
  EAuth:     1,
  FetchFail: 2,
  ServerErr: 3,
  NExist:    4
};


async function createChat(members) {
  console.log(members);
  const token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  var key = {
    p: num.getP(),
    g: num.getG(),
    x: num.getX()
  };
  
  const exps = [num.modExp(key.g, key.x, key.p)];
  console.log(exps);
  const msg = JSON.stringify({
    from: localStorage.getItem("id"),
    members: members,
    p: key.p.toString(16),
    g: key.g.toString(16),
    exponents: exps.map(d => d.toString(16))
  })
  const signature = await sign(msg);
  console.log(signature);
  try {
    var response = await fetch("/newChat", {
      method: "POST",
      body: JSON.stringify({
        sessionToken: token,
        members: members,
        g: key.g.toString(16),
        p: key.p.toString(16),
        exponents: exps.map(d => d.toString(16)),
        signature: signature}) 
    });
  } catch(e) {
    console.log(e);
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
      key.g = key.g.toString(16);
      key.p = key.p.toString(16);
      key.x = key.x.toString(16);
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
      x: num.getX().toString(16)
    };
    encryptedStore.setKey(channel, key);
    vectorClock.initChannel(channel, chan.members)
    var newExps = new Array();
    chan.exponents.forEach(function (exponent) {
      newExps.append(num.modExp(BigInt("0x" + exponent), BigInt("0x" + key.x), BigInt("0x" + chan.p)).toString(16));
    });
    // add our extra exponent
    newExps.append(num.modExp(BigInt("0x" + chan.g), BigInt("0x" + key.x), BigInt("0x" + chan.p)).toString(16));

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
  console.log(privKey);
  console.log(msg);
  const msgHash = await crypto.subtle.digest(
  	"SHA-256", 
  	new Uint8Array(Array.from(msg).map(d => d.charCodeAt(0)))
  );
  const signature = await ed25519.sign(new Uint8Array(msgHash), privKey);
  var pubKey = await ed25519.getPublicKey(privKey);
  return btoa(String.fromCharCode(...Array.from(signature)));
}

export const newChat = {
  errNewChat: errNewChat,
  createChat: createChat,
  acceptChat: acceptChat  
};
