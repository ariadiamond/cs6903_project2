
const errVec = {
  NoVecObj:  1,
  NoChannel: 2,
  InvalIdx:  3,
};

const DELIVER = 1;
const BUFFER  = 2;
const EQUAL   = 3;


function initChannel(channel, members) {
  var vecObj = sessionStorage.getItem("vecObj");
  if (vecObj == null) {
    return errVec.NoVecObj;
  }
  var newChan = {
    members:   members,
    clock:     new Uint32Array(members.length),
    Delivered: new Array(),
    Buffered:  new Array()
  };
  vecObj[channel] = newChan;
  
}

// if we call increment, it means we are sending a message
function increment(channel) {
  const idx = getIdx(channel, localStorage.getItem("id"));
  return incrementIdx(channel, idx);
}

function incrementIdx(channel, idx) {
  var vecObj = sessionStorage.getItem("vecObj");
  if (vecObj == null) {
    return errVec.NoVecObj;
  }
  var chan = vecObj[channel];
  if (chan == null) {
    return errVec.NoChannel;
  }
  if (idx >= chan.clock.length) {
    return errVec.InvalIdx;
  }
  chan.clock[idx] += 1;
  vecObj[channel] = chan;
  sessionStorage.setItem("vecObj", vecObj);
  return chan.clock;  
}

function getIdx(channel, from) {
  var vecObj = sessionStorage.getItem("vecObj");
  var chan = vecObj[channel];
  var i = 0;
  for (const member of chan.members) {
    if (member === from) {
      return i;
    }
    i += 1;
  }
  return -1;  
}

function deliver(from, channel, clock, message) {
  var vecObj = sessionStorage.getItem("vecObj");
  if (vecObj == null) {
    return errVec.NoVecObj;
  }
  var chan = vecObj[channel];
  if (chan == null) {
    return errVec.NoChannel;
  }
  
  var idx = getIdx(channel, from);
  switch(compareClock(chan.clock, clock)) {
    case DELIVER:
      chan.clock = incrementIdx(channel, idx); // we will overwrite incrementIdx
      chan.Delivered = chan.Delivered.append({from, message});
      chan = checkBuffer(channel, chan);
      break;
    case BUFFER:
      chan.Buffered = chan.Buffered.append({from, clock, message});
      break;
    default: // otherwise we should just discard
      break;
  }
  vecObj[channel] = chan;
  sessionStorage.setItem("vecObj", vecObj);
  return 0;
}

function checkBuffer(channel, chan) {
  var updated = true;
  while(updated) {
    updated = false;
    var newBuffer = new Array();
    for (const msg of chan.Buffered) {
      switch (compareClock(chan.clock, msg.clock)) {
        case DELIVER:
          updated = true;
          var idx = getIdx(channel, msg.from);
          chan.clock = incrementIdx(channel, idx);
          chan.Delivered = chan.Delivered.append({
            from: msg.from,
            message: msg.message
          });
          break;
        case BUFFER:
          newBuffer = newBuffer.append(msg);
          break;
        default:
          break;
      } // end switch
    } // end for
    chan.Buffer = newBuffer;
  } // end while
  return chan;
}


function compareClock(local, external) {
  if (local.length != external.length) {
    return -1;
  }
  var res = EQUAL;
  for (var i = 0; i < local.length; i++) {
    if (local[i] < external && res == DELIVER) {
      return BUFFER;
    }
    if (local[i] + 1 < external) {
      return BUFFER;
    }
    if (local[i] + 1 == external && res == EQUAL) {
      res = DELIVER;
    }
  }
  return res;
}


export const vectorClock = {
  err:         errVec,
  initChannel: initChannel,
  increment:   increment,
  deliver:     deliver
}
