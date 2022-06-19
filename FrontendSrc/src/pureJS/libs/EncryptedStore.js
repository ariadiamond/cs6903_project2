const COMPLETED = 0;
const INVAL     = 1;
const NEXIST    = 2;
const EXIST     = 3;

class EncryptedStore {
  #privKey;
  #password;
  #timestamp = 0;
  #keys = new Map();

  /* Getters and setters */
  addPrivKey(privKey) {
    if (this.#privKey !== undefined) {
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
  getPassword() {
    return this.#password;
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

  getChats() {
	  return [...this.#keys.keys()];
  }
  /* */
}

export default EncryptedStore;
