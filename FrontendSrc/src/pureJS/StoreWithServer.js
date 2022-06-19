import Fetcher from "./libs/Fetcher";
import utils from "./libs/utils";

/* eslint-disable no-magic-numbers */
const IV_SIZE   = 96 >> 3;
const SALT_SIZE = 16;
const ITERS     = 1 << 20;
/* eslint-enable no-magic-numbers */

async function derivePassword(password) {
  const u8Pwd     = utils.b64tou8(btoa(password));
  const forDerive = await crypto.subtle.importKey("raw", u8Pwd, "PBKDF2", false, ["deriveKey"]);
  const key       = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(SALT_SIZE), iterations: ITERS },
    forDerive,
    // eslint-disable-next-line no-magic-numbers
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

async function decryptData(fetchBody, password) {
  const { iv, encryptedData } = fetchBody;
  const kdp           = await derivePassword(password);
  const u8iv          = utils.b64tou8(iv);
  const u8encData     = utils.b64tou8(encryptedData);
  const decryptedData = await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8iv }, kdp, u8encData);
  return JSON.parse(decryptedData);
}

async function storeData(fetchBody, encryptedStore) {
  const decryptedObj = await decryptData(fetchBody, encryptedStore.getPassword());
  encryptedStore.addPrivKey(decryptedObj.privKey);
  encryptedStore.setTimestamp(decryptedObj.timestamp);
  for(const key of decryptedObj.keys) {
    const cryptoKey = utils.importKey(key.key);
    encryptedStore.setKey(key.id, cryptoKey);
  }

}

async function exportData(encryptedStore) {
  const kdp         = await derivePassword(encryptedStore.getPassword());
  const exportedObj = {
    privKey:   utils.u8tob64(encryptedStore.getPrivKey()),
    timestamp: encryptedStore.getTimestamp(),
    keys:      [encryptedStore.getChats().map(chat => {
      const key         = encryptedStore.getKey(chat);
      const exportedKey = utils.exportKey(key);
      return { id: chat, key: exportedKey };
    })]
  };
  const exportedStr          = JSON.stringify(exportedObj);
  const exportedU8           = utils.b64tou8(atob(exportedStr));
  const u8iv                 = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const encryptedArrayBuffer = await window.crypto.encrypt(
    { name: "AES-GCM", iv: u8iv },
    kdp,
    exportedU8
  );
  const encryptedData = utils.u8tob64(new Uint8Array(encryptedArrayBuffer));
  const ivStr         = utils.u8tob64(u8iv);
  return { iv: ivStr, encryptedData };
}

async function storeOnServer(sessionToken, encryptedStore) {
  const fetchBody = await exportData(encryptedStore);
  const fetch     = Fetcher.createFetcher("/store", fetchBody);
  const response  = await fetch.catch((e) => console.log(e));
  if (typeof response === "number" || !response.ok) {
    return 2;
  }
  return 0;
}

export default {
  derivePassword,
  storeOnServer,
  storeData
};

