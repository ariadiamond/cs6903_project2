import { register } from "/JavaScript/register.js";
import { encryptedStore } from "/JavaScript/encryptedStorage.js";

var signUpBtn = document.getElementById("signUpBtn");
signUpBtn.onclick = init;

async function init() {
  /* initialize local data */
  encryptedStore.init();
  sessionStorage.setItem("vecObj", "{}");
  var pubKey = await register.setup();
  var pass = document.getElementById("password").value;
  
  var resp = await register.register(pubKey);
  if (resp) { // we were able to sign up successfully
    console.log("Welcome", localStorage.getItem("id"));
    var result = await encryptedStore.storeWithServer(pass); // Store (encrypted) private key
    location.assign("/Visual/home.html")
  } else {
    console.log("signup failed");
    alert("Signup failed");
  }
}
