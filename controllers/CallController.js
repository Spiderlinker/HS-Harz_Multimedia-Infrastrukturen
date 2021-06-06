const roomHandler = require('../core/RoomHandler');
const uuid = require("uuid");

const handleSocketConnection = (socket) => {
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

  // These events are emitted to all the sockets connected to the same room except the sender.
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