let inputs = document.querySelectorAll("input");
inputs.forEach(d => { d.oninput = encipher; })

// Temp
const chars = "abcdefghijklmnopqrstuvwxyz".split("");
const shuffled = d3.shuffle(chars.slice());
const pairs = d3.zip(chars, shuffled);
showShuffle(pairs);

/**************************************************************************************************/
/* Functions */
/* encipher activates on any changes and updates the ciphertext based on the changes. */
function encipher() {
    let plainText = document.getElementById("plainTextOld").value;
    let outputText = document.getElementById("cipherTextOld");
    let encrypt = document.getElementById("encryptOld").checked ? true : false;
    let rotateAmt = document.getElementById("rotateAmt").valueAsNumber;

    let cipher = [...document.getElementsByName("oldCipherType").values()]
        .filter(d => d.checked)[0].value;
    /* Either show or hide slider based on what is necessary */
    if (cipher === "rotate") {
        document.getElementById("rotateAmtShow").hidden = false;
    } else {
        document.getElementById("rotateAmtShow").hidden = true;
    }
    if (cipher === "rndPerm" || cipher === "vignere") {
        document.getElementById("mappingShow").hidden = false;
    } else {
        document.getElementById("mappingShow").hidden = true;
    }
    
    switch (cipher) {
        case "caeser":
            outputText.value = rotate(plainText, encrypt, 3);
            break;
        case "rot13":
            outputText.value = rotate(plainText, encrypt, 13);
            break;
        case "rotate":
            outputText.value = rotate(plainText, encrypt, rotateAmt);
            break;
        case "rndPerm":
            outputText.value = randomPermutation(plainText, encrypt, new Map(pairs));
            break;
        case "vignere":
            outputText.value = vignere(plainText, encrypt, new Map(pairs));
    }
}

function swapPlaintext() {
    const oldCipherText = document.getElementById("cipherTextOld").value;
    const plainTextElem = document.getElementById("plainTextOld");
    const decryptRadio = document.getElementById("decryptOld");
    plainTextElem.value = oldCipherText;
    if (decryptRadio.checked) {
        const encryptRadio = document.getElementById("encryptOld");
        encryptRadio.checked = true;
    } else {
        decryptRadio.checked = true;
    }
    encipher();
}

function showShuffle(mapping) {
    const svg = d3.select("#mappingSVG");
        
    var x = char => {
        var pos = char.charCodeAt(0) - 96;
        pos *= 100 / 28;
        return new String(pos) + "%";
    }
    
    const top = svg.append('g');
    const bottom = svg.append('g');
    const lines = svg.append('g');
    top.selectAll('text')
        .data(mapping)
        .join('text')
            .text(([a, b]) => a)
            .attr('x', ([a, b]) => x(a))
            .attr('y', '20%')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle');
    bottom.selectAll('text')
        .data(mapping)
        .join('text')
            .text(([a, b]) => b)
            .attr('x', ([a, b]) => x(a))
            .attr('y', '80%')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle');

    lines.selectAll('line')
        .data(mapping)
        .join('line')
            .attr('x1', ([a, b]) => x(a))
            .attr('x2', ([a, b]) => x(a))
            .attr('y1', '30%')
            .attr('y2', '70%')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
}

/**************************************************************************************************/
/* Ciphers */

function rotateChar(letter, offsetAmt) {
    const charCode = letter.charCodeAt(0) + offsetAmt;
    var output;
    if (charCode < 32) {
        output = String.fromCharCode(charCode + (126 - 32));
    } else if (charCode > 126) {
        output = String.fromCharCode(charCode - (126 - 32));
    } else {
        output = String.fromCharCode(charCode);
    }
    return output;
}
/* For encryption, this adds key to each ascii character, wrapping around at the top and
 * bottom. For decryption, the opposite is done. Each character has key subtracted and then
 * any wrapping to put values back into place is done.
 *
 * plainText::String - encrypt/decrypt this value
 * encrypt::bool - encrypt if true, decrypt if false
 * key::int - amount of places to rotate
 */
function rotate(plainText, encrypt, key) {
    var cipherText = "";
    const offsetAmt = encrypt ? key : -key;
    
    for (const letter of plainText) {
        cipherText += rotateChar(letter, offsetAmt);
    } // end for
    return cipherText;
}

/*
 *
 * plainText::String - string to either encrypt or decrpyt
 * encrypt::bool - encrypt the plaintext if true, or decrypt if false
 * key::Map - a mapping of each letter to another for a random permutation
 */
function randomPermutation(plainText, encrypt, key) {
    // Create/reuse the map so we don't have to change anything for actual encryption
    var keyMap; // allow this to be inverted in the event of decryption
    if (encrypt) {
        keyMap = key;
    } else {
        keyMap = new Map(Array.from(key).map(([a, b]) => [b, a]));
    }
    
    var cipherText = "";
    for (const letter of plainText) {
        cipherText += keyMap.get(letter);
    }
    return cipherText;
}

/*
 *
 */
function vignere(plainText, encrypt, key) {
    var cipherText = "";
    if (encrypt) {
        var intermed = randomPermutation(plainText, true, key);
        var i = 0;
        for (const letter of intermed) {
            cipherText += rotateChar(letter, i % 26);
            i++;
        }
    } else {
        var intermed = "";
        var i = 0;
        for (const letter of plainText) {
            intermed += rotateChar(letter, -(i % 26));
            i++;
        }
        cipherText = randomPermutation(intermed, false, key);
    }
    return cipherText;
}
