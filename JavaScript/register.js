import { Validate } from "/JavaScript/validate.js";
import { encryptedStore } from "/JavaScript/encryptedStorage.js";
import { ed25519 } from "/JavaScript/Libs/noble-ed25519.js";
// https://github.com/paulmillr/noble-ed25519/releases/download/1.3.0/noble-noble-ed25519.js

/* setup creates a public private ed25519 key pair for verification of identity
 * and messages. It stores the private key in long term storage at "privKey". It
 * returns the public key generated.
 */
async function setup() {
  const privKey = ed25519.utils.randomPrivateKey();
  const pubKey  = await ed25519.getPublicKey(privKey);
  encryptedStore.init(privKey);
  return pubKey;
}

/* register sends the fetch request to register with the server and get a
 * Cryptik ID. It takes the public key as an argument, and sets the Cryptik ID
 * as "id" and session token as "sessionToken" in localStorage. It returns true
 * on success, and false on failure.
 */
async function registerFunc(pubKey) {
  try { // catch promise if it is rejected
    var resp = await fetch("/create", {
      method: "POST",
      body: JSON.stringify({"publicKey": btoa(String.fromCharCode(...Array.from(pubKey)))})
    });
  } catch(e) {
    console.log(e);
    return false;
  }
  switch (resp.status) {
    case 200:
      var json = await resp.json(); // parse json object
      //if (!Validate.ValidateId(json.id) ||              // check the server is
      //    !Validate.ValidateToken(json.sessionToken)) { // not giving bad data
      //  console.log("Unable to validate inputs");
      //  return false;
      //}
      // store data
      localStorage.setItem("id", json.id);
      localStorage.setItem("token", json.sessionToken);
      return true;
    default: // 400, 500
      return false;
  }
}

export const register = {
  setup:    setup,
  register: registerFunc
};
