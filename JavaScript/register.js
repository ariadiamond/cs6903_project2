import { Validate } from 'validate.js';
import * as ed25519 from 'noble-ed25519.js'; // TODO remote host
// https://github.com/paulmillr/noble-ed25519/releases/download/1.3.0/noble-ed25519.js

/* setup creates a public private ed25519 key pair for verification of identity
 * and messages. It stores the private key in long term storage at "privKey". It
 * returns the public key generated.
 */
async function setup() {
  const privKey = ed25519.utils.randomPrivateKey();
  const pubKey  = await ed25519.getPublicKey(privKey);
  localStorage.setItem('privKey', privKey);
  return pubKey;
}

/* register sends the fetch request to register with the server and get a
 * Cryptik ID. It takes the public key as an argument, and sets the Cryptik ID
 * as "id" and session token as "sessionToken" in localStorage. It returns true
 * on success, and false on failure.
 */
async function register(pubKey) {
  try { // catch promise if it is rejected
    const resp = await fetch("/create", {
      method: "POST",
      body: JSON.stringify({"publicKey": pubKey})
    });
  } catch(e) {
    return false;
  }
  
  switch (resp.status) {
    case 200:
      var json = await resp.json(); // parse json object
      if (!Validate.ValidateId(json.id) ||              // check the server is
          !Validate.ValidateToken(json.sessionToken)) { // not giving bad data
        return false;
      }
      // store data
      localStorage.setItem('id', json.id);
      localStorage.setItem('sessionToken', json.sessionToken);
      return true;
    default: // 400, 500
      return false;
  }
  return false;
}
