
export const errEncryptedStore = {
  NoDecryptObj:       1,
  ChanNotInitialized: 2,
  NoKey:              3,
  MissingData:        4,
  FetchFail:          5,
  EAuth:              6,
  ServerErr:          7
};


/* decryptData
 * 16 byte salt
 * 96 bit iv
 */
async function decryptData(iv, salt, encryptedData, password) {
  const forDeriveKey = await crypto.subtle.importKey(
    "raw",          // raw key material
    Array.from(password.map(d => d.charCodeAt(0))), // array of password bits
    "PBKDF2",       // use PBKDF2 to derive an AES key for this
    false,          // do not allow exports
    ["deriveKey"]); // this will be used for derivation 
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2", 
      hash: "SHA-256", 
      salt: Array.from(salt.map(d => d.charCodeAt(0))), 
      iterations: 1000
    },
    forDeriveKey,
    {name: "AES-GCM", length: 256},
    false,
    ["encrypt", "decrypt"]
  );
  sessionStorage.setItem("pbKey", key);
  // now that we have the key, we can decrypt!
  const decryptData = await crypto.subtle.decrypt(
    {name: "AES-GCM", iv: Array.from(iv.map(d => d.charCodeAt(0)))},
    key,
    Array.from(encryptedData.map(d => d.charCodeAt(0)))
  );
  const decryptObj = JSON.parse(decryptData);
  sessionStorage.setItem("decryptObj", decryptObj);
  return 0;
}

/*
 */
function getPrivKey() {
  // get and check for decryptObj
  const decryptObj = sessionStorage.getItem("decryptObj");
  if (decryptObj == null) {
    errEncryptedStore.NoDecryptObj;
  }
  
  // try to get the private key
  const privKey = decryptObj?.privKey;
  if (privKey == null) {
    return errEncryptedStore.NoKey;
  }
  return privKey;  
}


function getKey(channel) {
  const decryptObj = sessionStorage.getItem("decryptObj");
  if (decryptObj == null) {
    errEncryptedStore.NoDecryptObj;
  }
  
  const key = decryptObj[channel]?.key;
  if (key == null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  return key;
}

function getClock(channel) {
  const decryptObj = sessionStorage.getItem("decryptObj");
  if (decryptObj == null) {
    errEncryptedStore.NoDecryptObj;
  }
  
  const key = decryptObj[channel]?.key;
  if (key == null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  
  // if we have created/joined the channel, but it has not been fully
  // initialized in that we have not derived the shared key
  if (key?.g != null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  
  // this should not fail
  return decryptObj.channel.clock;
}

// TODO ensure that there are no conflicts with load-update-store operations
function setKey(channel, keyObj) {
  var decryptObj = sessionStorage.getItem("decryptObj");
  if (decryptObj == null) {
    return errEncryptedStore.NoDecryptObj;
  }
  
  if (decryptObj?.channel == null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  decryptObj.channel.key = keyObj;
  sessionStorage.setItm("decryptObj", decryptObj);
  return 0;
}

// TODO ensure that there are no conflicts with load-update-store operations
function setClock(channel, clockObj) {
  var decryptObj = sessionStorage.getItem("decryptObj");
  if (decryptObj == null) {
    return errEncryptedStore.NoDecryptObj;
  }
  
  if (decryptObj?.channel?.key == null) {
    return errEncryptedStore.ChanNotInitialized;
  }
  
  decryptObj.channel.clock = clockObj;
  sessionStorage.setItem("decryptObj", decryptObj);
  return 0;
}

async function storeWithServer() {
  const key        = sessionStorage.getItem("pbKey");
  const decryptObj = sessionStorage.getItem("decryptObj");
  const token      = localStorage.getItem("token");
  if (key == null || decryptObj == null || token == null) {
    return errEncryptedStore.MissingData;
  }
  
  const dataToEnc = Array.from(JSON.stringify(decryptObj)
    .map(d => d.charCodeAt(0)));
  
  // create a new iv for each time we store the data on the server
  var iv = crypto.getRandomValues(new Uint8Array(96 >> 3));
  const encData = await crypto.subtle.encrypt(
    {name: "AES-GCM", iv: iv},
    key,
    dataToEnc
  );
  
  try {
    var response = await fetch("/store", {
      method: "POST",
      body: JSON.stringify({
        sessionToken: token,
        iv: iv,
        encryptedData: encData})
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

export const encryptedStore = {
  decryptData:     decryptData,
  getPrivKey:      getPrivKey,
  getKey:          getKey,
  getClock:        getClock,
  setKey:          setKey,
  setClock:        setClock,
  storeWithServer: storeWithServer
};
