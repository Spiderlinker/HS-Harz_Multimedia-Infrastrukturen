import messageHandler from './MessageHandler.js';

// DOM elements.
const roomSelectionContainer = document.getElementById('establish_connection_container')
const roomInput = document.getElementById('room_id');
const connectButton = document.getElementById('connect_button');

const choiceContainer = document.getElementById('choice-connection-container');
const creationContainer = document.getElementById('creation_container');
const joinRoomButton = document.getElementById('join_room');
const toCreateRoomButton = document.getElementById('to_create_room');
const createRoomButton = document.getElementById('create_room');
const endCallButton = document.getElementById('end_call');

const settingsContainer = document.getElementById('settings_container');
const stunInput = document.getElementById('stun_server');
const turnInput = document.getElementById('turn_server');
const settingsButton = document.getElementById('settings');
const saveSettingsButton = document.getElementById('save_settings');

const videoChatContainer = document.getElementById('call-container');
const localVideoComponent = document.getElementById('local-video');
const remoteVideoComponent = document.getElementById('remote-video');
const camDisableEnableButton = document.getElementById('cam_disable_enable');
const micMuteUnmuteButton = document.getElementById('mic_mute_unmute');

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

// Free public STUN servers provided by Google.
let iceServers = {
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
  //video, choice, room, creation, settings
  showContainer('none', 'none', 'block', 'none', 'none');
});

toCreateRoomButton.addEventListener('click', () => {
  //video, choice, room, creation, settings
  showContainer('none', 'none', 'none', 'block', 'none');
});

createRoomButton.addEventListener('click', () => {
  joinRoom(null);
});

settingsButton.addEventListener('click', () => {
  //video, choice, room, creation, settings
  showContainer('none', 'none', 'none', 'none', 'block');
});

saveSettingsButton.addEventListener('click', () => {
  rewriteSettings();
});

endCallButton.addEventListener('click', () => {
  location.reload();
});

camDisableEnableButton.addEventListener('click', () =>{
  disableEnableCam();
});

micMuteUnmuteButton.addEventListener('click', () =>{
  muteUnmuteMic();
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

    messageHandler.setupRoomCreateDataChannel(rtcPeerConnection);

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

    messageHandler.setupRoomJoinDataChannel(rtcPeerConnection);

    await createAnswer(rtcPeerConnection);
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
  console.log(iceServers);
  if (room === '') {
    alert('Bitte geben Sie eine Raum-ID an!');
  } else {
    roomId = room
    socket.emit('join', room);
    //video, choice, room, creation, settings
    showContainer('block', 'none', 'none', 'none', 'none');
  }
}

function showContainer(video, choice, room, creation, settings){
  videoChatContainer.style = `display: ${video}`;
  choiceContainer.style = `display: ${choice}`;
  roomSelectionContainer.style = `display: ${room}`;
  creationContainer.style = `display: ${creation}`;
  settingsContainer.style = `display: ${settings}`;
}

function rewriteSettings(){
  iceServers = {
    iceServers: [
      { urls: `stun:stun.${stunInput.value}` },
      { urls: `turn:turn.${turnInput.value}` },
    ],
  }
  //video, choice, room, creation, settings
  showContainer('none', 'block', 'none', 'none', 'none');
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

function muteUnmuteMic(){
  localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
  console.log(localStream.getAudioTracks()[0]);
}

function disableEnableCam(){
  localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled);
  console.log(localStream.getVideoTracks()[0]);
}