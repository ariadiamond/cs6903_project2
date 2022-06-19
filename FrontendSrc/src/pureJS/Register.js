import Validate from "./libs/Validate";
import Fetcher from "./libs/Fetcher";
import utils from "./libs/utils";

import * as ed25519 from "@noble/ed25519";

const FETCH_FAIL = 1;
const INVAL_JSON = 2;

/* createKey creates a public private ed25519 key pair for verification of identity and messages. It
 * stores the private key in long term storage at "privKey". It returns the public key generated.
 */
async function createKey(EncryptedStore) {
  const privKey = ed25519.utils.randomPrivateKey();
  const pubKey  = await ed25519.getPublicKey(privKey);
  EncryptedStore.addPrivKey(privKey);
  const b64PubKey = utils.u8tob64(pubKey);
  return b64PubKey;
}

async function register(pubKey) {
  const fetch = Fetcher.createFetcher("/create", {publicKey: pubKey});
  const response = await fetch.catch(() => FETCH_FAIL);
  if (typeof response == "number" || !response.ok) {
    return FETCH_FAIL;
  }
  const json = await response.json().catch(() => INVAL_JSON);
  if (typeof response == "number") {
    return response;
  }
  const { id, sessionToken } = json;
  if (!Validate.validateId(id) || !Validate.validateToken(sessionToken)) {
    return INVAL_JSON;
  }

  return { id, token: sessionToken };
}


export default {
  createKey,
  register
};
