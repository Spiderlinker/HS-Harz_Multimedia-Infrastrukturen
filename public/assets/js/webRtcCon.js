import messageHandler from './MessageHandler.js';

/**
 * DOM Elemente zur Steuerung des Views Connection.ejs
 */
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

/**
 * Standadrd STUN-Server
 */
let iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// KEY EVENT LISTENER ============================================================


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
/**
 * Diese Methode wird beim Event "room_created" aktiviert. Die RaumID wird gesetzt und die definierten
 * Media Constraints werden gesetzt. Die boolean Variable isRoomCreator wird auf true gesetz um den Nutzer
 * als Raumersteller im späteren Prozess wiederzuerkennen. Anschließend wird auf eine Verbindung gewartet.
 */
socket.on('room_created', async (room) => {
  console.log('Socket event callback: room_created');
  roomId = room;
  roomIdDisplay.innerHTML = `Raum-ID: ${roomId}`;
  await setLocalStream(mediaConstraints);
  isRoomCreator = true;
});

/**
 * Diese Methode wird beim Event "room_joined" aktiviert. Die MediaConstraints werden gesetzt und es wird
 * das Event "start_call" über den Socket übertragen.
 */
socket.on('room_joined', async () => {
  console.log('Socket event callback: room_joined');
  await setLocalStream(mediaConstraints);
  socket.emit('start_call', roomId);
});

/**
 * Diese Methode wird beim Event "full_room" aktiviert und generiert einen Meldung.
 */
socket.on('full_room', () => {
  console.log('Socket event callback: full_room');
  alert('Dieser Raum ist aktuell voll!');
});

/**
 * Diese Methode initialisiert die rtcPeerConnection, dabei werden die STUN- und TURN-Server 
 * übergeben. Anschließend werden die Video und Audio Tracks der Verbindung hinzugefügt. Die Eigenschaften
 * ontrack und onicecandidate werden gesetzt. Hier werden Methoden übergeben die beim eintritt des events
 * angesprochen werden. In dieser Methode wird noch der Datenchannel für den Chat angelegt. Zum Abschluss
 * wird ein rtcPeerConnection offer erstellt. Diese Methode wird immer von dem Nutzer ausgeführt, welcher dem erstellten
 * Raum joined.
 */
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

/**
 * Diese Methode wird aktiviert sobald die webRTC offer erfolgreich durchlaufen wurde. Sollte es sich um den
 * Raumersteller handeln, erstellt dieser ebenfalls eine rtcPeerConnection fügt seine Audio und Video tracks hinzu
 * und setzt die beiden Eigenschaften ontrack und onicecandidate wie in @see socket.on('start_call'). Der Raum ersteller
 * setzt zusätzlich noch die Remote Description welche die Eigenschaften auf Remote seite zeigen.  Anschließend
 * tritt er noch dem DataChannel für die Chat Übertragung bei und sented sein webRTC Antwort.
 */
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

/**
 * Der Nutzer welcher dem Raum beigetreten ist erhält die WebRTC Antwort und spezifiziert seine Remote Eigenschaften.
 * Sollte kein WebRTC Ice Event für die Verbindung benötigt werden besteht hier eine Verbindung.
 */
socket.on('webrtc_answer', (event) => {
  console.log('Socket event callback: webrtc_answer');
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

/**
 * Diese Methode wird aktiviert sofern die Eigenschaft onicecandidate getriggert wird. Sollte also keine Verbindung aufgebaut werden
 * können wird über den STUN-Server der NAT-Type bestimmt oder gar über einen TURN-Server der traffic geleitet. 
 */
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

/**
 * Diese Methode nimmt eine roomID oder null entgegegen, dieser Wert wird über den einen socket.emit
 * an den Server übermittelt. Der Server erstellt oder tritt dem angegebnen Raum bei. Der videoChatContainer
 * wird auf sichtbar gestellt alle anderen Container werden ausgeblendet.
 *   
 * @param {string} room 
 * 
 */
function joinRoom(room) {
  if (room === '') {
    alert('Bitte geben Sie eine Raum-ID an!');
  } else {
    roomId = room
    socket.emit('join', room);
    //video, choice, room, creation, settings
    showContainer('block', 'none', 'none', 'none', 'none');
  }
}

/**
 * Diese Methode ermöglicht es die bestehenden Container bei bedarf ein- und
 * auszublenden hierfür muss entweder der String "none" für ausblenden und
 * "block" für einblenden übergeben werden.
 * 
 * @param {string} video - videoChatContainer "none" oder "block"
 * @param {string} choice - choiceContainer "none" oder "block"
 * @param {string} room - roomSelectionContainer "none" oder "block"
 * @param {string} creation - creationContainer "none" oder "block"
 * @param {string} settings - settingsContainer "none" oder "block"
 * 
 */
function showContainer(video, choice, room, creation, settings){
  videoChatContainer.style = `display: ${video}`;
  choiceContainer.style = `display: ${choice}`;
  roomSelectionContainer.style = `display: ${room}`;
  creationContainer.style = `display: ${creation}`;
  settingsContainer.style = `display: ${settings}`;
}

/**
 * Diese Methode ermöglicht es einem Nutzer die bestehenden STUN und TURN Server 
 * zu überschreiben und seine eigenen zu nutzen.
 */
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

/**
 * Diese Methode nimmt die oben definierten MediaConstraints entgegen und 
 * startet eine Berechtigungsanfrage über den Browser des Nutzers. Stimmt
 * der User der Nutzung von Kamera und Mikrofon zu kann eine webRTC Verbindung
 * aufgebaut werden. Die Variable localStream wird gesetzt und es wird auf die
 * gegenstelle gewartet. 
 * 
 * @error Sollte ein Fehler bei der Abfrage auftreten oder der Nutzer den Zugriff verweigern
 * wird eine Fehlermeldung als alert und in der console wiedergegeben. 
 * 
 * @param {list} mediaConstraints 
 */
async function setLocalStream(mediaConstraints) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  } catch (error) {
    console.error('Could not get user media', error);
    alert('Es konnte nicht auf ihre Kamera und Mikrofon zugegriffen werden. Ein Verbindung is nicht möglich!');
  }

  localStream = stream;
  localVideoComponent.srcObject = stream;
}

/**
 * Diese Methode fügt die beiden Tracks Audio und Video der 
 * rtcPeerConnection hinzu, damit diese übertragen werden können. 
 * 
 * @param {interface} rtcPeerConnection 
 */
function addLocalTracks(rtcPeerConnection) {
  localStream.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, localStream);
  });
}

/**
 * Diese Methode initiert das SDP (Session Description Protocol (peer-to-peer Verbindungen))
 * um eine WebRTC Verbindung zu starten. Im SDP sind Informationen wie der Kodec, Quelladresse und
 * die Timing-Informationen für Audio und Video enthalten. Als Ergebnis des offers erhält die Methode
 * eine sessionDescription welche die Konfiguration angibt, die am lokalen Ende der Verbindung angewendet
 * werden soll. Diese lokale Beschreibung muss in der rtcPeerConnection gesetzt werden kann bei Bedarf auch
 * weggelassen werden (Beim weglassen wird versucht die Konfiguration automatisch herzustellen).
 * 
 * @error - Sollte eine Verbindungsanfrage fehlschlagen wird der Fehlerfall in der Konsole des Nutzers
 * ausgegeben.
 *  
 * @param {interface} rtcPeerConnection 
 */
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

/**
 * Diese Methode erstellt eine SDP (mehr Informationen zu SDP @see createOffer) antwort auf
 * eine remote anfrage. Die Antwort enthält alle bereits hinzugefügten Media Track (Audio und Video)
 * und alle bereits angegeben STUN und TURN (ICE) Server. Diese Antwort wird an den Anfragenden zurück
 * übermittelt um den Aushandelungsprozess fortzusetzen.
 * 
 * @error - Sollte die Erstellung der Antwort fehlschlagen wird der Fehlerfall in der Konsole des Nutzers
 * ausgegeben.
 * 
 * @param {interface} rtcPeerConnection 
 */
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

/**
 * Diese Methode setzt den Mediastream des Verbindungspartners auf das dafür vorgesehene
 * DOM Object.
 * @param {*} event 
 */
function setRemoteStream(event) {
  remoteVideoComponent.srcObject = event.streams[0];
  remoteStream = event.stream;
}

/**
 * Diese Methode sendet die vom Nutzer oder bereits vordefinierten STUN- und TURN Server
 * an den Server über einen Socket emit.
 * 
 * @param {*} event 
 */
function sendIceCandidate(event) {
  if (event.candidate) {
    socket.emit('webrtc_ice_candidate', {
      roomId,
      label: event.candidate.sdpMLineIndex,
      candidate: event.candidate.candidate,
    });
  }
}

/**
 * Diese Methode erlaubt es das Mikrofon zu muten und zu entmuten
 */
function muteUnmuteMic(){
  localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
  console.log(localStream.getAudioTracks()[0]);
}

/**
 * Diese Methode ermöglicht die Kontroller der eigenen Kamera ressource man kann sie an und
 * abschalten.
 */
function disableEnableCam(){
  localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled);
  console.log(localStream.getVideoTracks()[0]);
}