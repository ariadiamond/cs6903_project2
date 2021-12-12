import { register } from "/JavaScript/register.js";

var signUpBtn = document.getElementById("signUpBtn");
signUpBtn.onclick = init;

async function init() {
  /* initialize local data */
  console.log("setup data");
  sessionStorage.setItem("decryptObj", {});
  sessionStorage.setItem("vecObj", {});
  console.log("create pub key");
  var pubKey = await register.setup();
  
  console.log("do request");
  var resp = await register.register(pubKey);
  console.log("response");
  if (resp) { // we were able to sign up successfully
    console.log("Welcome", localStorage.getItem("id"));
    location.assign("/Visual/cryptikChannelCreate.html")
  } else {
    console.log("signup failed");
    alert("signup failed");
  }
}
