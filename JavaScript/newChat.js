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

/* createChat takes a list of members and initializes a chat by creating G and
 * P, and sends them to the server to allow other clients to see the chat!
 *
 * Note: this function takes a long time because we have to create a large
 *       prime.
 */
async function createChat(members) {
  const token = localStorage.getItem("token");
  if (token == null) {
    return errNewChat.EAuth;
  }
  // generate a key with P and G, and store as serialized strings
  var key = {
    p: num.getP().toString(num.RADIX),
    g: num.getG().toString(num.RADIX),
    x: num.getX().toString(num.RADIX)
  };
  
  const exps = [num.modExp(
    num.parseStr(key.g),
    num.parseStr(key.x),
    num.parseStr(key.p)
  ).toString(num.RADIX)];
  
  // sign message
  const msg = JSON.stringify({
    from: localStorage.getItem("id"),
    members: members,
    p: key.p, // p, g, and exps are already string representations
    g: key.g,
    exponents: exps
  })
  const signature = await sign(msg);
  
  // do fetch call to send data to server
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
    console.log(e);
    return errNewChat.FetchFail;
  }
  
  // check the response
  switch (response.status) {
    case 200:
      try {
        var json = await response.json();
        var channel = json.channel;
      } catch(e) {
        return errNewChat.ServerErr;
      }
      // add key to storage
      encryptedStore.setKey(channel, key);
      return 0; // :)
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
    // create key
    var key = {
      g: chan.g,
      p: chan.p,
      x: num.getX().toString(num.RADIX)
    };
    encryptedStore.setKey(channel, key);
    vectorClock.initChannel(channel, chan.members);
    
    // update the exponents by adding my x
    var newExps = new Array();
    
    // parse x and p for better performance and less redone work
    var x = num.parseStr(key.x);
    var p = num.parseStr(key.p);
    chan.exponents.forEach(exponent => newExps.unshift(
      num.modExp(
        num.parseStr(exponent),
        x,
        p
      ).toString(num.RADIX))
    );
    // add our extra exponent
    // we only have to use g once, so there's no loop iteration that would
    // repeat a bunch of work
    newExps.unshift(num.modExp(num.parseStr(chan.g), x, p).toString(num.RADIX));

    // sign updated things
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
    // we can do a much shorter signature
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
  
  // do the request to the server to update it
  try {
    var response = await fetch("/acceptChat", {
      method: "POST",
      body: body
    });
  } catch(e) {
    console.error(e);
    return errNewChat.FetchFail;
  }
  
  // switch on the repsonse
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
  // grab the key to sign with
  const privKey = encryptedStore.getPrivKey();
  const msgHash = await crypto.subtle.digest(
    "SHA-256", 
    // convert string to byte representation
    new Uint8Array(Array.from(msg).map(d => d.charCodeAt(0)))
  );
  // convert hash to bytes from ArrayBuffer
  const signature = await ed25519.sign(new Uint8Array(msgHash), privKey);
  // convert bytes to base64 string
  return btoa(String.fromCharCode(...Array.from(signature)));
}

export const newChat = {
  errNewChat: errNewChat,
  createChat: createChat,
  acceptChat: acceptChat  
};
