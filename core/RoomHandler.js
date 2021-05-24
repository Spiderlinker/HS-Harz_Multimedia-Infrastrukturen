const roomMap = new Map();

function checkActualClients(roomId, task){
  switch(task){
    case "connect":
      if(roomMap.has(roomId)){
        clientCount = roomMap.get(roomId);
        clientCount++;
        roomMap.set(roomId, clientCount);
      }else{
        roomMap.set(roomId, 0);
      }
      break;
    case "disconnect":
      if(roomMap.has(roomId)){
        clientCount = roomMap.get(roomId);
        clientCount--;
        roomMap.set(roomId, clientCount);
      }
      //TODO delete room
      break;
    default:
      console.log("Fehlerhafte Task übergeben!");
      break;
  }
}

function getClientForRoom(roomID){
    return roomMap.get(roomID);
}

module.exports = {
    checkActualClients,
    getClientForRoom
}