const roomMap = new Map();

/**
 * Diese Methode verwaltet die aktuellen Räume und deren Nutzer. Hierfür wirde geprüft
 * ob der Nutzer einen "connect" oder "disconnect" durchführt. Bei einem "connect"
 * soll die Nutzeranzahl in der Map um 1 erhöht werden. Sollte ein "disconnect" übergeben
 * werden muss die Nutzeranzahl um 1 verringert werden. 
 * 
 * @param {string} roomId - spezifische einzigartige RaumID 
 * @param {string} task - Connect / Disconnet um die Client Aktion zu spezifizieren
 * @returns Aktuelle Nutzeranzal im übergebenen Raum
 */
function updateActualClients(roomId, task){
  switch(task){
    case "connect":
        return addClientToRoom(roomId);
    case "disconnect":
        return removeClientFromRoom(roomId)
    default:
        console.log("Fehlerhafte Task übergeben!");
        break;
  }
}

/**
 * Diese Methode fügt einen Nutzer den übergebenen Raum hinzu, dabei überprüft sie ob der übergebene Raum 
 * bereits in der Map existiert. Ist er existent wird der aktuelle Wert aus der Map geholt und um 1 erhöht.
 * Sollte der Raum nicht in der Map existieren, so wird ein entsprechender Eintrag erzeugt.
 * 
 * @param {string} roomId - spezifische einzigartige RaumID
 * @returns Aktuelle Nutzeranzal im übergebenen Raum
 */
function addClientToRoom(roomId){

    if(!roomMap.has(roomId)){
        roomMap.set(roomId, 0);
        return roomMap.get(roomId);
    }

    let clientCount = roomMap.get(roomId);
    clientCount++; 
    if(clientCount < 2){
        roomMap.set(roomId, clientCount)
    }
    return clientCount;
}

function isPresent(roomId){
    if(roomMap.has(roomId))
        return true;
    return false;
}

/**
 * Diese Methode entfernt einen Nutzer aus dem übergeben Raum, dabei überprüft sie
 * ob der angegebene Raum in der Map existiert. Ist der Raum existent wird die Nutzeranzahl
 * um 1 verringert, sollte dabei die Nutzeranzahl auf -1 fallen wird der Raum gelöscht. 
 * Anmerkung: Fällt die Nutzeranzahl auf -1 hat der Raumersteller den Raum verlassen und der Raum
 * wird nicht weiter benötigt.
 * 
 * @Todo Überprüfen ob dadurch ein Raum ungewollt gelöscht werden kann. Diese gilt es zu vermeiden.
 * 
 * @param {string} roomId 
 * @returns Aktuelle Nutzeranzahl oder void
 */
function removeClientFromRoom(roomId){
    if(!roomMap.has(roomId))
        return;
    
    let clientCount = roomMap.get(roomId);
    clientCount--;
    roomMap.set(roomId, clientCount);

    if(clientCount == -1)
        return deleteRoomFromMap(roomId);

    return clientCount;
}

/**
 * Diese Methode löscht einen Raum aus der angelegten Map.
 * 
 * @param {string} roomId 
 * @returns 
 */
function deleteRoomFromMap(roomId){
    return roomMap.delete(roomId);
}


module.exports = {
    updateActualClients,
    isPresent
}