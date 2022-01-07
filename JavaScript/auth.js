import { Validate } from "/JavaScript/validate.js";
import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import * as ed25519 from "/JavaScript/Libs/noble-ed25519.js";

const errAuth = {
  Id:         1,
  Auth1:      2,
  InvalNonce: 3,
  ServerErr:  4,
  Auth2:      5,
  InvalToken: 6,
  WrongSig:   7,
  NoNonce:    8
};

async function authFunc(password) {
  const id = localStorage.getItem("id");
  if (id == null) {
    return errAuth.Id;
  }
  
  /* auth step 1 */
  try {
    var resp = await fetch("/auth/1", {
      method: "POST",
      body: JSON.stringify({"id": id})
    });
  } catch(e) {
    return errAuth.Auth1;
  }
  console.log(resp);
  switch (resp.status) {
    case 200:
      console.log("To parse json");
      var json  = await resp.json();
      console.log("Parsed json");
      var nonce = json.nonce;
      encryptedStore.decryptData(
        json.iv,
        json.encryptedFile,
        password);
      if (!Validate.ValidateNonce(nonce)) {
        return errAuth.InvalNonce;
      }
      break;
    case 404:
      return errAuth.Id;
    default:
      return errAuth.ServerErr;
  }
  
  const privKey = encryptedStore.getPrivKey();
  const signature = await ed25519.sign(nonce, privKey);
  
  try {
    resp = await fetch("/auth/2", {
      method: "POST",
      body: JSON.stringify({id: id, nonce: nonce, signature: signature})
    });
  } catch(e) {
    return errAuth.Auth2;
  }
  switch (resp.status) {
    case 200:
      json = await resp.json();
      var token = json.sessionToken;
      if (!Validate.ValidateToken(token)) {
        return errAuth.InvalToken;
      }
      localStorage.setItem("token", token);
      break;
    case 403:
      return errAuth.WrongSig;
    case 404:
      return errAuth.NoNonce;
    default:
      return errAuth.ServerErr;
  }
}

function getPK(id) {
  return fetch("/getpk/" + id)
    .then(response => {
      if (response.status != 200) {
        return false;
      }
      return response.json().pubKey;
    })
    .catch(false);
}

export const auth = {
  err:   errAuth,
  auth:  authFunc,
  getPK: getPK
};
