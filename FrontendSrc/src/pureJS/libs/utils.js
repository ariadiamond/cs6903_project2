const INVAL = 1;

function u8tob64(u8Array) {
  const array = Array.from(u8Array);
  const byteString = String.fromCharCode(array);
  return btoa(byteString);
}

function b64tou8(str) {
  const byteString = atob(str);
  const array = Array.from(byteString);
  return new Uint8Array(array);
}

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

export default {
  u8tob64,
  b64tou8,
  importKey,
  exportKey
};
