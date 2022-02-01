// library implementing Diffie Hellman operations on big ints
// n following many numbers is to covnert them to big ints

const PRIME_BITS = 3072;
const G_BITS     = 256;
const X_BITS     = 256;
const ITER       = 100;
const RADIX = 16;

// from slide 19 of lecture 3
// 2^-ITER probability of an incorrect result
function testPrime(bi) {
  for (var i = 0; i < ITER; i++) {
    var r = 1000n;
    var r2 = 2n << r;
    while (r2 < bi) {
      r += 1n;
      r2 = r2 << 1n;
    }
    var d = bi - r2;
    var xData = crypto.getRandomValues(new Uint32Array(X_BITS));
    var str = "0x";
    xData.forEach(hex => str = str + hex.toString(16));
    var y = modExp(BigInt(str), d, bi);
    if (y == 1n || y == bi - 1n) {
      continue;
    }
    for (var j = 1; j < r; j++) {
      y = y ** 2n % bi;
      if (y == 1n) {
        return false;
      }
    }
  }
  return true;

}

function getBigPrime() {
  for (;;) { // try this until we get a prime
    var rand = crypto.getRandomValues(new Uint32Array(PRIME_BITS >> 5));
    var str = "0x";
    rand.forEach(d => str = str + d.toString(16));
    var bi = BigInt(str);
    if (bi % 2n == 0n) {
      bi += 1n; // make odd
    }
    if (bi < 0n) { // make positive
      bi *= -1n;
    }
    if (testPrime(bi)) { // check prime
      return bi;
    }
  }
}

function getG() {
  // get a bunch of randomness
  var rand = crypto.getRandomValues(new Uint32Array(G_BITS >> 5));
  // convert to hex string
  var str = "0x";
  rand.forEach(d => str = str + d.toString(16));
  // convert to big int from hex string
  var bi = BigInt(str);
  return bi;
}

/* getx creates a large random number that is X_BITS length. We use a shorter
 * length because I think I saw somewhere that only the prime has to be super
 * long and the base and exponent can be shorter. This should be checked at some
 * point.
 */
function getX() {
  var rand = crypto.getRandomValues(new Uint32Array(X_BITS >> 5));
  var str = "0x";
  rand.forEach(d => str = str + d.toString(16));
  var bi = BigInt(str);
  return bi;
}

// Square and multiply, as described on page 11 of the Lecture 3 slides
function modExp(base, exponent, modulus) {
  if (exponent <= 1n) {
    return base;
  }
  var t;
  if (exponent % 2n == 0n) { // even
    t = modExp(base, exponent / 2n, modulus);
    return t ** 2n % modulus;
  } else { // odd
    t = modExp(base, (exponent - 1n) / 2n, modulus);
    return base * t ** 2n % modulus;
  }
}

function parseString(str) {
  var prefix = "";
  switch (RADIX) {
    case 2:
      prefix = "0b";
      break;
    case 8:
      prefix = "0";
      break;
    case 10:
      break;
    case 16:
      prefix = "0x";
      break;
    default:
      return "Help!!";
  }
  return BigInt(prefix + str);
}

export const num = {
  getP:   getBigPrime,
  getG:   getG,
  getX:   getX,
  modExp: modExp,
  // helpers for serialization of big ints
  RADIX:    RADIX,
  parseStr: parseString
};
