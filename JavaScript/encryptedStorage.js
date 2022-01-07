const errEncryptedStore = {
  NoDecryptObj:       1,
  ChanNotInitialized: 2,
  NoKey:              3,
  MissingData:        4,
  FetchFail:          5,
  EAuth:              6,
  ServerErr:          7
};

function init(privKey) {
  var decryptObj = {
    privKey:   privKey,
    timestamp: Date()
  };
  
  sessionStorage.setItem("decryptObj", JSON.stringify(decryptObj));
}


async function derivePassword(/* salt, */ password) {
  const forDeriveKey = await crypto.subtle.importKey(
    "raw",          // raw key material
    // uint8 array of bytes of password
    new Uint8Array(Array.from(password).map(d => d.charCodeAt(0))),
    "PBKDF2",       // use PBKDF2 to derive an AES key for this
    false,          // do not allow exports
    ["deriveKey"]); // this will be used for derivation
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2", 
      hash: "SHA-256",
      salt: new Uint8Array(16), // TODO store on server so it can be non-zero
      iterations: 1 << 20 // big number
    },
    forDeriveKey,
    {name: "AES-GCM", length: 256},
    false,
    ["encrypt", "decrypt"]
  );
  sessionStorage.setItem("pbKey", JSON.stringify(key));
  return key;
}

/* decryptData takes the encrypted data stored on the server (or locally) and
 * decrypts it to make it available through the encryptedStore API. it takes a:
 *   - 96 bit iv, which is stored on the server with the encrypted data
 *   - 16 byte salt, which is stored with the iv on the server and used to
 *     prevent rainbow table attacks
 *   - encrypted data, which was previously encrypted by a client and stored on
 *     on the server
 *   - password, entered by the user and used to decrypt the data
 */
async function decryptData(iv, encryptedData, password) {
  const key = await derivePassword(password);
  // now that we have the key, we can decrypt!
  const decryptData = await crypto.subtle.decrypt(
    {name: "AES-GCM", iv: Array.from(iv.map(d => d.charCodeAt(0)))},
    key,
    Array.from(encryptedData.map(d => d.charCodeAt(0)))
  );
  sessionStorage.setItem("decryptObj", decryptData);
  return 0;
}

/* getPrivKey gets the ed25519 private key used for signatures.
 */
function getPrivKey() {
  // get and check for decryptObj
  const decryptString = sessionStorage.getItem("decryptObj");
  if (decryptString == null) {
    errEncryptedStore.NoDecryptObj;
  }
  const decryptObj = JSON.parse(decryptString);
  
  // try to get the private key
  const privKey = decryptObj?.privKey;
  if (privKey == null) {
    return errEncryptedStore.NoKey;
  }
  return privKey;  
}

/* getKey gets the key object given a provided channel. This can return either
 * the data used for key derivation if the channel has not been initialized, or
 * a CryptoKey with the AES-GCM key if the channel has been initialized.
 */
function getKey(channel) {
  const decryptString = sessionStorage.getItem("decryptObj");
  if (decryptString == null) {
    errEncryptedStore.NoDecryptObj;
  }
  const decryptObj = JSON.parse(decryptString);
  
  const key = decryptObj[channel]?.key;
  if (key == null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  return key;
}

function getTimestamp() {
  const decryptString = sessionStorage.getItem("decryptObj");
  if (decryptString == null) {
    return errEncryptedStore.NoDecryptObj;
  }
  const decryptObj = JSON.parse(decryptString);
  
  return decryptObj.timestamp;
}


/* setKey stores the keyObj at the particular channel, adding the channel if
 * necessary, as well as the clock if the channel has been fully initialized.
 *
 * TODO ensure that there are no conflicts with load-update-store operations
 */
function setKey(channel, keyObj) {
  const decryptString = sessionStorage.getItem("decryptObj");
  if (decryptString == null) {
    return errEncryptedStore.NoDecryptObj;
  }
  var decryptObj = JSON.parse(decryptString);
  
  if (decryptObj[channel] == null) { // initialize channel
    decryptObj[channel] = new Object();
  }
  
  decryptObj[channel].key = keyObj;
  sessionStorage.setItm("decryptObj", JSON.stringify(decryptObj));
  return 0;
}

function setTimestamp(timestamp) {
  const decryptString = sessionStorage.getItem("decryptObj");
  if (decryptString == null) {
    return errEncryptedStore.NoDecryptObj;
  }
  var decryptObj = JSON.parse(decryptString);
  
  decryptObj.timestamp = timestamp;
  sessionStorage.setItem("decryptObj", JSON.stringify(decryptObj));
}

/* storeWithServer creates a new iv and encrypts the secret keys associated with
 * the Cryptik ID, then stores it on the server, allowing access to account from
 * any computer or after signing out without requiring external data to be kept
 * by the client. Since the data is encrypted with AES256-GCM, it is infeasible
 * to expect an attacker to break the encryption (unless a poor password is
 * chosen).
 */
async function storeWithServer(password) {
  const key = await derivePassword(password);
  const decryptString = sessionStorage.getItem("decryptObj");
  const token      = localStorage.getItem("token");
  if (decryptString == null || token == null) {
    return errEncryptedStore.MissingData;
  }
  
  const dataToEnc = new Uint8Array(Array.from(decryptString)
    .map(d => d.charCodeAt(0)));
  
  // create a new iv for each time we store the data on the server
  var iv = crypto.getRandomValues(new Uint8Array(96 >> 3));
  const encData = new Uint8Array(await crypto.subtle.encrypt(
    {name: "AES-GCM", iv: iv},
    key,
    dataToEnc
  ));
  
  try {
    var response = await fetch("/store", {
      method: "POST",
      body: JSON.stringify({
        sessionToken: token,
        iv: btoa(String.fromCharCode(...Array.from(iv))), // convert to base64
        encryptedData: btoa(String.fromCharCode(...Array.from(encData)))})
    });
  } catch(e) {
    return errEncryptedStore.FetchFail;
  }
  switch(response.status) {
    case 200:
      return 0;
    case 403:
      return errEncryptedStore.EAuth; 
    case 404:
      return errEncryptedStore.NExist;
    default:
      return errEncryptedStore.ServerErr;
  }
}

/* encryptedStore is an object that holds the functions implemented, as well as
 * "err", which holds the error codes from the functions.
 */
export const encryptedStore = {
  err:             errEncryptedStore,
  init:            init,
  decryptData:     decryptData,
  getPrivKey:      getPrivKey,
  getKey:          getKey,
  getTimestamp:    getTimestamp,
  setKey:          setKey,
  setTimestamp:    setTimestamp,
  storeWithServer: storeWithServer
};
