// DOM elements.
const roomSelectionContainer = document.getElementById('establish_connection_container')
const roomInput = document.getElementById('room_id');
const nameInput = document.getElementById('name');
const connectButton = document.getElementById('connect_button');

const choiceContainer = document.getElementById('choice-connection-container');
const joinRoomButton = document.getElementById('join_room');
const createRoomButton = document.getElementById('create_room');

const videoChatContainer = document.getElementById('call-container');
const localVideoComponent = document.getElementById('local-video');
const remoteVideoComponent = document.getElementById('remote-video');

const roomIdDisplay = document.getElementById('room_id_display');

// Variables.
const socket = io();
const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
};
let localStream;
let remoteStream;
let isRoomCreator;
let rtcPeerConnection; // Connection between the local device and the remote peer.
let roomId;

let fileTransferChannel;

// Free public STUN servers provided by Google.
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// BUTTON LISTENER ============================================================
connectButton.addEventListener('click', () => {
  joinRoom(roomInput.value);
});

joinRoomButton.addEventListener('click', () => {
  showSelectionContainer();
});

createRoomButton.addEventListener('click', () => {
  joinRoom(null);
});

// SOCKET EVENT CALLBACKS =====================================================
socket.on('room_created', async (room) => {
  console.log('Socket event callback: room_created');
  roomId = room;
  roomIdDisplay.innerHTML = `Raum-ID: ${roomId}`;
  await setLocalStream(mediaConstraints);
  isRoomCreator = true;
});

socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined');
  await setLocalStream(mediaConstraints);
  socket.emit('start_call', roomId);
});

socket.on('full_room', () => {
  console.log('Socket event callback: full_room');
  alert('The room is full, please try another one');
});

socket.on('start_call', async () => {
  console.log('Socket event callback: start_call');

  if (isRoomCreator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    addLocalTracks(rtcPeerConnection);
    rtcPeerConnection.ontrack = setRemoteStream;
    rtcPeerConnection.onicecandidate = sendIceCandidate;
    // createFileDataChannel();
    await createOffer(rtcPeerConnection);
  }
});

socket.on('webrtc_offer', async (event) => {
  console.log('Socket event callback: webrtc_offer');

  if (!isRoomCreator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    addLocalTracks(rtcPeerConnection);
    rtcPeerConnection.ontrack = setRemoteStream;
    rtcPeerConnection.onicecandidate = sendIceCandidate;
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    // createFileDataChannel();
    await createAnswer(rtcPeerConnection);

    sendFile("C:\\Users\\Charl\\Desktop\\Anwendungspraktikum2021SS.pdf");
  }
});

socket.on('webrtc_answer', (event) => {
  console.log('Socket event callback: webrtc_answer');
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on('webrtc_ice_candidate', (event) => {
  console.log('Socket event callback: webrtc_ice_candidate');

  // ICE candidate configuration.
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

// FUNCTIONS ==================================================================
function joinRoom(room) {
  if (room === '') {
    alert('Bitte geben Sie eine Raum-ID an!');
  } else {
    roomId = room
    socket.emit('join', room);
    showVideoConference();
  }
}

function showVideoConference() {
  roomSelectionContainer.style = 'display: none';
  choiceContainer.style = 'display: none';
  videoChatContainer.style = 'display: block';
}

function showSelectionContainer() {
  videoChatContainer.style = 'display: none';
  choiceContainer.style = 'display: none';
  roomSelectionContainer.style = 'display: block';
}

async function setLocalStream(mediaConstraints) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  } catch (error) {
    console.error('Could not get user media', error);
  }

  localStream = stream;
  localVideoComponent.srcObject = stream;
}

function addLocalTracks(rtcPeerConnection) {
  localStream.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, localStream);
  });
}

async function createOffer(rtcPeerConnection) {
  let sessionDescription;
  try {
    sessionDescription = await rtcPeerConnection.createOffer();
    rtcPeerConnection.setLocalDescription(sessionDescription);
  } catch (error) {
    console.error(error);
  }

  socket.emit('webrtc_offer', {
    type: 'webrtc_offer',
    sdp: sessionDescription,
    roomId,
  });
}

async function createAnswer(rtcPeerConnection) {
  let sessionDescription;
  try {
    sessionDescription = await rtcPeerConnection.createAnswer();
    rtcPeerConnection.setLocalDescription(sessionDescription);
  } catch (error) {
    console.error(error);
  }

  socket.emit('webrtc_answer', {
    type: 'webrtc_answer',
    sdp: sessionDescription,
    roomId,
  });
}

function setRemoteStream(event) {
  remoteVideoComponent.srcObject = event.streams[0];
  remoteStream = event.stream;
}

function sendIceCandidate(event) {
  if (event.candidate) {
    socket.emit('webrtc_ice_candidate', {
      roomId,
      label: event.candidate.sdpMLineIndex,
      candidate: event.candidate.candidate,
    });
  }
}



// function createFileDataChannel() {
//   console.log("Creating file channel");
//   fileTransferChannel = rtcPeerConnection.createDataChannel('FileTransferChannel');
//   fileTransferChannel.binaryType = 'arraybuffer';
//   fileTransferChannel.onmessage = async (event) => receiveFile(event);
// }

// async function sendFile(file) {
//   console.log("sending file: " + file);
//   if (!file) {
//     return;
//   }

//   console.log("Sending...");
//   const arrayBuffer = await file.arrayBuffer();
//   for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
//     fileTransferChannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
//   }
//   console.log("Send end of file message");
//   fileTransferChannel.send(END_OF_FILE_MESSAGE);
// }

// function receiveFile(data) {
//   console.log("receiving file...");
//   const receivedBuffers = [];
//   try {
//     if (data !== END_OF_FILE_MESSAGE) {
//       receivedBuffers.push(data);
//     } else {
//       const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
//         const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
//         tmp.set(new Uint8Array(acc), 0);
//         tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
//         return tmp;
//       }, new Uint8Array());
//       const blob = new Blob([arrayBuffer]);
//       console.log("download file: ")
//       downloadFile(blob, 'Textdatei.txt'); // TODO irgendwie anders übermitteln
//     }
//   } catch (err) {
//     console.log('File transfer failed');
//   }
// }

// function downloadFile(blob, fileName) {

//   console.log("create html elements to download file");
//   const a = document.createElement('a');
//   const url = window.URL.createObjectURL(blob);
//   a.href = url;
//   a.download = fileName;
//   a.click();
//   window.URL.revokeObjectURL(url);
//   a.remove()
// }


