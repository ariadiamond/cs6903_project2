const COMPLETED = 0;
const INVAL     = 1;
const NEXIST    = 2;
const EXIST     = 3;

const exportKeyFormat = "raw";
const encryptAlgorithm = { name: "AES-GCM" };
const keyUsage        = ["encrypt", "decrypt"];

async function importKey(exportedKey) {
  const byteString = btoa(exportedKey);
  const codePointArray = Array.from(byteString).map(c => c.charCodeAt());
  const u8Array = new Uint8Array(codePointArray);
  const cryptoKey = await window.crypto.importKey(
    exportKeyFormat,
    u8Array,
    encryptAlgorithm,
    true,
    keyUsage)
      .catch(e => {
        console.error(e);
        return INVAL;
      });
  return cryptoKey;
}

async function exportKey(cryptoKey) {
  const arrayBuffer = await window.crypto.exportKey(cryptoKey, exportKeyFormat);
  const u8Array = new Uint8Array(arrayBuffer);
  const byteString = String.fromCharCode(Array.from(u8Array));
  return atob(byteString);
}

class EncryptedStore {
  #privKey;
  #password;
  #timestamp = 0;
  #keys = new Map();

  /* Getters and setters */
  addPrivKey(privKey) {
    if (this.#privKey !== null) {
      return EXIST;
    }
    this.#privKey = privKey;
  }
  getPrivKey() {
    return this.#privKey;
  }
  addPassword(password) {
    this.#password = password;
  }
  
  getTimestamp() {
    return this.#timestamp;
  }
  setTimestamp(ts) {
    if (typeof ts !== "number" || ts <= this.#timestamp) {
      return INVAL;
    }
    this.#timestamp = ts;
    return COMPLETED;
  }
  
  getKey(id) {
    if (typeof id !== "number") {
      return INVAL;
    }
    const key = this.#keys.get(id);
    if (key === undefined) {
      return NEXIST;
    }
    return key;
  }
  
  addKey(id, key) {
    if (this.#keys.has(id)) {
      return EXIST;
    }
    this.#keys.set(id, key);
    return COMPLETED;
  }
  /* */
}

export default EncryptedStore;
