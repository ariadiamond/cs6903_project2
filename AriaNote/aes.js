/*************
 * Functions *
 *************/
/* aesEncipher */
function aesEncipher() {
    let plaintext = document.getElementById("plaintextAES").value;
    if (plaintext.length < 16) {
        kdf();
        return;
    }
    plaintext = Array.from(plaintext.substring(0, 16)).map(d => d.charCodeAt(0));
    
    let outputtext = document.getElementById("ciphertextAES");
    let mode = [...document.getElementsByName("AESType").values()].filter(d => d.checked)[0].value;
    let key = kdf();
    
    var aes;
    const iv = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    switch(mode) {
        case "AESECB":
            aes = new aesjs.ModeOfOperation.ecb(key);
            break;
        case "AESCBC":
            aes = new aesjs.ModeOfOperation.cbc(key, iv);
            break;
        case "AESOFB":
            aes = new aesjs.ModeOfOperation.ofb(key, iv);
            break;
        case "AESCTR":
            aes = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(33));
            break;
        default:
            console.log("Oops this is wrong");
    }
    let encryptBlocks = document.getElementsByName("AESEncBlock");
    encryptBlocks.forEach(d => {
        const ciphertext = aes.encrypt(plaintext);
        d.value = aesjs.utils.hex.fromBytes(ciphertext);
    });
}



function kdf() {
    let password = document.getElementById("passwordAES").value;
    let keyInput = document.getElementById("keyAES");
    // N = 10, r = 1, parallelism = 1, keyLengthBytes = 16
    let passwordArr = Array.from(password).map(d => d.charCodeAt(0));
    let saltArr = Array.from("saltines:)").map(d => d.charCodeAt(0));
    let key = scrypt.syncScrypt(passwordArr, saltArr, 16, 1, 1, 16);
    keyInput.value = aesjs.utils.hex.fromBytes(key);
    return key;
}