import { findChat } from "/JavaScript/findChat.js";
import { newChat } from "/JavaScript/newChat.js";

var sendReqBtn = document.getElementById("sendReqBtn");
sendReqBtn.onclick = sendReq;

console.log("pre findChat");
var acceptList = await findChat.findChat();
console.log(acceptList);
console.log("post findChat");
if (typeof acceptList === "number") { // something went wrong with acceptList
  console.log("Error finding chats", acceptList);
} else {
  var requests = document.getElementById("requests");
  if (acceptList.length == 0) { // we don't have any requests
  	const noReqs = document.createElement("p");
  	noReqs.innerHTML = "There are no requests at the moment";
  	requests.append(noReqs);
  } else { // print requests we have
    acceptList.forEach(function (chan, index, array) {
    	// add text describing channel
    	const channel = document.createElement("p");
    	channel.innerHTML = chan.channel;
    	// add accept button
    	const accept = document.createElement("button");
    	accept.onclick = accept;
    	accept.name = channel;
    	accept.innerHTML = "+";
    	channel.append(accept);
    	// add decline button
    	const decline = document.createElement("button");
    	decline.onclick = decline;
    	decline.name = channel;
    	decline.innerHTML = "-";
    	channel.append(decline);  
    	// add new line
    	requests.append(channel);
    }); // end for
  } // end else
}

async function sendReq() {
  var ids = document.getElementById("members").value;
  var members = ids.split(",");
  console.log(members);
  var id = localStorage.getItem("id");
  console.log(id);
  members.unshift(id);
  console.log(members);
  var resp = await newChat.createChat(members);
  console.log(resp);
}