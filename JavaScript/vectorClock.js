
function initChannel(channel, members) {
  var vecObj = sessionStorage.getItem("vecObj");
  if (vecObj == null) {
    return errVec.NoVecObj;
  }
  var newChan = {
    members: members,
    clock: Uint32Array(members.length())
  };
  vecObj[channel] = newChan;
  
}

// if we call increment, it means we are sending a message
function increment(channel) {
  const idx = getIdx(channel, localStorage.getItem("id"));
  return incrementIdx(channel, idx);
}

function incrementIdx(channel, idx) {

}

function getIdx(channel, from) {
  
}

function deliver(from, channel, clock, message) {

}





export const vectorClock = {
  err:       errVec,
  increment: increment,
  deliver:   deliver
}