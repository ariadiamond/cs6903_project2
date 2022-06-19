const ID_LEN    = 4;
const NONCE_LEN = 24;
const TOKEN_LEN = 32;

// regular expressions
const reHex = /^0-9a-fA-F/;
const reB64 = /^0-9a-zA-Z+\/=/;

function validateString(str, len, regex) {
  if (typeof str !== "string" || str.length !== len) {
    return false;
  }
  return !regex.test(str);
}

function validateId(id) {
  return validateString(id, ID_LEN, reHex);
}

function validateNonce(nonce) {
  return validateString(nonce, NONCE_LEN, reB64);
}

function validateToken(token) {
  return validateString(token, TOKEN_LEN, reHex);
}

export default {
  validateId,
  validateNonce,
  validateToken
};
