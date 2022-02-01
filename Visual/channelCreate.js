import { findChat } from "/JavaScript/findChat.js";
import { newChat } from "/JavaScript/newChat.js";

var sendReqBtn = document.getElementById("sendReqBtn");
sendReqBtn.onclick = sendReq;

// acceptList is a global variable
var acceptList = await findChat.findChat();
if (typeof acceptList === "number") { // something went wrong with acceptList
  console.log("Error finding chats", acceptList);

} else { // we were successful with chats

  var requests = document.getElementById("requests");
  if (acceptList.size == 0) { // we don't have any valid requests
  	const noReqs = document.createElement("p");
  	noReqs.innerHTML = "There are no requests at the moment";
  	requests.append(noReqs);

  } else { // print requests we have
    // iterate through channels (keys) of map
    [...acceptList.keys()].forEach(function (chan) {
    	// add text describing channel
    	const channel = document.createElement("p");
    	channel.innerHTML = chan;
    	// add accept button
    	const accept = document.createElement("button");
    	accept.onclick = acceptChat;
    	accept.id = chan + "accept";
    	accept.innerHTML = "+";
    	channel.append(accept);
    	// add decline button
    	const decline = document.createElement("button");
    	decline.onclick = declineChat;
    	decline.name = chan + "decline";
    	decline.innerHTML = "-";
    	channel.append(decline);  
    	// add new line
    	requests.append(channel);
    }); // end forEach
  } // end else
}

/* sendReq is the way that we grab all the members typed in and parse the ids. At the momement it
 * expects no spaces and comma separation, but maybe we could do space separation also?
 */
async function sendReq() {
  var ids = document.getElementById("members").value;
  var members = ids.split(",");
  console.log(members);
  var id = localStorage.getItem("id");
  // add us to the front
  members.unshift(id);
  var resp = await newChat.createChat(members);
  console.log(resp);
}

async function acceptChat(elem) {
  // since we set the id to something unique (different between accept and decline, we have to
  // remove that uniqueness and convert to a number as that is how the map stores it
  var chan = acceptList.get(Number(elem.target.id.replace("accept", "")));
  // accept has to be asynchronous because we need to sign things crypto.subtle.dgst and
  // ed25519.sign are both async
  var response = await newChat.acceptChat(chan.channel, true, chan);
  console.log("Response to acceptChat", response);
}

async function declineChat(elem) {
  var chan = acceptList.get(Number(elem.target.id.replace("decline", "")));
  var response = newChat.acceptChat(chan.channel, false, chan);
  console.log("Response to declineChat", response);
}