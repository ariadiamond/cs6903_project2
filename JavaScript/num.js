// library implementing operations on big ints

const PRIME_BITS = 3072;
const G_BITS     = 256;
const X_BITS     = 256;
const ITER       = 100;

// from slide 19 of lecture 3
function testPrime(bi) {
  for (var i = 0; i < ITER; i++) { // k
    var r = 1000n;
    var r2 = 2n << r;
    while (r2 < bi) {
      r++;
      r2 << 1;
    }
    var d = bi - r2;
    var xData = crypto.getRandomValues(new Uint32Array(X_BITS));
    var str = "";
    xData.forEach(d => str = str + d.toString(16));
    var y = modExp(BigInt(xData), d, bi);
    if (y == 1 || y == bi - 1) {
      continue;
    }
    for (var j = 1; j < r; j++) {
      y = y ** 2 % bi;
      if (y == 1) {
        return false;
      }
    }
  }
  return true;

}

function getBigPrime() {
  for (;;) {
    var rand = crypto.getRandomValues(new Uint32Array(PRIME_BITS >> 5));
    var str = "";
    rand.forEach(d => str = str + d.toString(16));
    var bi = BigInt(str);
    if (bi % 2 == 0) {
      bi += 1; // make odd
    }
    if (testPrime(bi)) { // check prime
      return bi;
    }
  }
}

function getG() {
  var rand = crypto.getRandomValues(new Uint32Array(G_BITS >> 5));
  var str = "";
  rand.forEach(d => str = str + d.toString(16));
  return BigInt(str);
}

function getX() {
  var rand = crypto.getRandomValues(new Uint32Array(X_BITS >> 5));
  var str = "";
  rand.forEach(d => str = str + d.toString(16));
  return BigInt(str);
}

// Square and multiply, as described on page 11 of the Lecture 3 slides
function modExp(base, exponent, modulus) {
  if (exponent == 1) {
    return base;
  }
  var t;
  if (exponent % 2 == 0) { // even
    t = modExp(base, exponent / 2, modulus);
    return t ** 2 % modulus;
  } else { // odd
    t = modExp(base, (exponent - 1) / 2, modulus);
    return base * t ** 2 % modulus;
  }
}

export const num = {
  getP:   getBigPrime,
  getG:   getG,
  getX:   getX,
  modExp: modExp
};
