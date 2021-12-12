export const ID_LEN     = 4;
export const NONCE_SIZE = 32;
export const TOKEN_SIZE = 32;

const reID    = new RegExp("[^0-9a-fA-F]");
const reNonce = new RegExp("[^0-9a-fA-F]");
const reToken = new RegExp("[^0-9a-fA-F]");
//const reCert  = new RegExp();


function ValidateId(id) {
  if (id.length != ID_LEN) {
    return false;
  }
  return !reID.test(id);
}

function ValidateNonce(nonce) {
  if (nonce.length != NONCE_SIZE) {
    return false;
  }
  return !reNonce.test(nonce);
}

function ValidateToken(token) {
  if (token.length != TOKEN_SIZE) {
    return false;
  }
  return !reToken.test(token);
}

export const Validate = {
  ValidateId:    ValidateId,
  ValidateNonce: ValidateNonce,
  ValidateToken: ValidateToken
};

