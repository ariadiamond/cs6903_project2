import { auth } from "/JavaScript/auth.js";

var loginBtn = document.getElementById("login");
loginBtn.onclick = init;

async function init() {
  /* initialize local data */
  sessionStorage.setItem("decryptObj", {});
  sessionStorage.setItem("vecObj", {});

  var id = document.getElementById("cryptikID").value;
  localStorage.setItem("id", id);
  var resp = await auth.auth(document.getElementById("password").value);
  switch (resp) {
    case 0:
      location.assign("/Visual/cryptikChannelCreate.html");
      break;
    default:
      console.log("auth failed", resp);
      alert("Login failed, sorry");
      break;
  }
}
