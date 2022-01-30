import { Validate } from "/JavaScript/validate.js";
import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { ed25519 } from "/JavaScript/Libs/noble-ed25519.js";

const errAuth = {
  Id:         1,
  Auth1:      2,
  InvalNonce: 3,
  ServerErr:  4,
  Auth2:      5,
  InvalToken: 6,
  WrongSig:   7,
  NoNonce:    8,
  WrongPass:  9
};

async function authFunc(password) {
  const id = localStorage.getItem("id");
  if (id == null) {
    return errAuth.Id;
  }
  
  /* auth step 1 - get nonce and decrypt our keys */
  try {
    var resp = await fetch("/auth/1", {
      method: "POST",
      body: JSON.stringify({"id": id})
    });
  } catch(e) {
    return errAuth.Auth1;
  }
  
  switch (resp.status) {
    case 200:
      var json  = await resp.json();
      var nonce = json.nonce;
      // take encrypted private keys and try to decrypt them
      // after this, we should have a valid decryptObj in our sessionStorage
      // that holds our private ed25519 key for signing in auth2
      var decrypt = await encryptedStore.decryptData(
        json.iv,
        json.encryptedFile,
        password);
      if (decrypt != 0) { // something went wrong
        return errAuth.WrongPass;
      }
      break;
    case 404:
      return errAuth.Id;
    default:
      return errAuth.ServerErr;
  }
  
  /* Sign nonce for verification */
  // grab our ed25519 private key
  const privKey = encryptedStore.getPrivKey();
  // convert from base64 to byte representation
  var arrNonce = new Uint8Array(Array.from(atob(nonce))
    .map(d => d.charCodeAt(0)));

  // sign byte representation of nonce with byte representation of key
  const signature = await ed25519.sign(arrNonce, privKey);
  
  /* auth step 2 - verify with server and get session token*/
  try {
    resp = await fetch("/auth/2", {
      method: "POST",
      body: JSON.stringify({
        id: id,
        nonce: nonce,
        // convert signature to base64 string from byte representation
        signature: btoa(String.fromCharCode(...Array.from(signature)))})
    });
  } catch(e) {
    return errAuth.Auth2;
  }
  
  // respond with various error codes based on server response
  switch (resp.status) {
    case 200: // valid auth, get session token
      json = await resp.json();
      var token = json.sessionToken;
      //if (!Validate.ValidateToken(token)) {
      //  return errAuth.InvalToken;
      //}
      localStorage.setItem("token", token);
      return 0; // :)
    case 403:
      return errAuth.WrongSig;
    case 404:
      return errAuth.NoNonce;
    default:
      return errAuth.ServerErr;
  }
}

async function getPK(id) {
  var response = await fetch("/getpk/" + id);
  if (response.status != 200) {
    return false;
  }
  var json = await response.json(); 
  return new Uint8Array(Array.from(atob(json.pubKey))
    .map(d => d.charCodeAt(0)));
}

export const auth = {
  err:   errAuth,
  auth:  authFunc,
  getPK: getPK
};
