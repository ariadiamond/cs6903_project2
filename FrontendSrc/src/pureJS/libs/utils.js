function u8tob64(u8Array) {
  const array = Array.from(u8Array);
  const byteString = String.fromCharCode(array);
  return btoa(byteString);
}

function b64toU8(str) {
  const byteString = atob(str);
  const array = Array.from(byteString);
  return new Uint8Array(array);
}


export default {
  u8tob64,
  b64toU8
};
