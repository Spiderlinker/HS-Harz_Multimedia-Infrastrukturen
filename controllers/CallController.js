const roomHandler = require('../core/RoomHandler');
const uuid = require("uuid");
/**
 * Diese Funktion kontrolliert alle über den übergebenen Socket transportierten Events.
 * 
 * @param {socket} socket 
 */
const handleSocketConnection = (socket) => {

  /**
   * Diese Funktion wartet auf einen socket emit mit der Spezifizierung "join". Sollte die dabei übergebene
   * RaumID null sein handelt es sich um die Erstellung eines neuen Raums. Über das Modul "uuid" wird eine Raum-ID
   * generiert. Sollte eine RaumID übergeben wurden sein wird diese verwendet.
   * Über den RoomHandler wird die Anzahl der aktuellen Teilnehmer verarbeitet und es wird
   * ein Server-Log erzeugt. Sollte die Teilnehmeranzahl 0 entsprechen wird der Raum erzeugt. Bei einer Teilnehmer-
   * anzahl von 1 wird dem Raum beigetreten. Bei einer Teilnehmeranzahl von 2 ist der Raum voll, da sich
   * nur 2 Teilnehmer in diesem Raum befinden sollen. Es wird eine Meldung generiert. 
   */
  socket.on('join', (roomId) => {

    if(roomId == null)
      roomId = uuid.v4();

    const clientCount = roomHandler.updateActualClients(roomId, "connect");
    console.log(`Die aktuelle Nutzeranzahl für den Raum: ${roomId} beträgt: ${clientCount}`);

  // These events are emitted only to the sender socket.
  if (clientCount == 0) {
    console.log(`Creating room ${roomId} and emitting room_created socket event`)
    socket.join(roomId)
    socket.emit('room_created', roomId)
  } else if (clientCount == 1) {
    console.log(`Joining room ${roomId} and emitting room_joined socket event`)
    socket.join(roomId)
    socket.emit('room_joined', roomId)
  } else {
    console.log(`Can't join room ${roomId}, emitting full_room socket event`)
    socket.emit('full_room', roomId)
  }
  })

  /**
   * Die nachfolgenden Events werden an alle übermittelt, die mit diesem socket Verbunden sind ausgenommen dem Sender.
   * Alle Events dienen lediglich der Steuerung / Kommunikation zur Aushandelung der WebRTC Verbindung 
   */
  socket.on('start_call', (roomId) => {
    console.log(`Broadcasting start_call event to peers in room ${roomId}`)
    socket.broadcast.to(roomId).emit('start_call')
  })
  socket.on('webrtc_offer', (event) => {
    console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
  })
  socket.on('webrtc_answer', (event) => {
    console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
  })
  socket.on('webrtc_ice_candidate', (event) => {
    console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
  })

  /**
   * Sollte ein Teilnehmer den Raum verlassen, so wird die aktuelle Nutzeranzahl entsprechend reduziert.
   * Dieses Event wird automatisch getriggert. Da nur vorgesehen ist, das jeder Nutzer nur einem Raum beitreten kann,
   * ist es möglich über die List einheitlich den eingetretenen Raum zu bestimmen.
   */
  socket.on('disconnecting', () => {
    socket.rooms.forEach((value) => {
      if(roomHandler.isPresent(value)){
        const clientCount = roomHandler.updateActualClients(value, "disconnect");
        console.log(`Has left room: ${value} usercount beträgt: ${clientCount}`);
      }
    });
  });
}

//export this function when require
module.exports = {
    handleSocketConnection
}