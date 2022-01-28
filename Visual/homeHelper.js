import { vectorClock } from "/JavaScript/vectorClock.js";
import { encryptedStore } from "/JavaScript/encryptedStorage.js";

//document.getElementById("hello").innerHTML = "Hello + " + localStorage.getItem("id") + "!";


/* Add channels already initialized */
var div = document.getElementById("chats");
var channels = vectorClock.getChannels();
if (channels.length == 0) {
  const elem = document.createElement("p");
  elem.innerHTML = "No chats initialized, <a href=\"/Visual/cryptikChannelCreate.html\">add one</a>?"
  div.append(elem);
} else {
  for (const chan of channels) {
  	const btn     = document.createElement("button");
  	btn.onclick   = enterChat;
  	btn.id        = chan;
  	btn.innerHTML = chan;
  	div.append(btn);
  	div.append(document.createElement("br"));
  }
}
console.log(encryptedStore.getPrivKey());

function enterChat(elem) {
  sessionStorage.setItem("activeChannel", elem.target.id);
  location.assign("/Visual/cryptikChannel.html");
}
