import fileHandler from './FileHandler.js';
import iconPaths from './icons/IconPaths.js';

/**
 * DOM Elemente zur Steuerung der Views establish_connection_container.ejs und creation_container.ejs
 */
const nameInput = document.getElementById('name');
const nameInputCreator = document.getElementById('name_creator');

/**
 * DOM Elemente zur Steuerung des Views chat.ejs
 */
const chatMessages = document.getElementById('chat-messages');
const shareFileButton = document.getElementById('select-file-input');
const sendChatButton = document.getElementById('btn-send-chat');
const textField = document.getElementById('chat-field');

/**
 * Konstanten
 */
const MAXIMUM_MESSAGE_SIZE = 65535;
const END_OF_FILE_MESSAGE = 'EOF';

const CHAT_CHANNEL_IDENTIFIER = "ChatChannel";
const FILE_CHANNEL_IDENTIFIER = "FileChannel";

/**
 * Variablen
 */
let chatChannel;
let fileChannel;

let requestedFileName;
let receivedBuffers;

// KEY EVENT LISTENER ============================================================
/** 
 * Wenn Enter getätigt wird, wird die vom Nutzer im Textfeld eingegebene Nachricht
 * an die Methode sendTextMessage weitergegeben.
 */
document.onkeydown = function(event) {
	if (event.key === 'Enter') {
        let value = textField.value;
        if (value) {
            sendTextMessage(value);
            textField.value = "";
        }
	}
};

// BUTTON LISTENER ============================================================
/**
 * Wenn der shareFileButton getätigt wird, wird die vom Nutzer ausgewählte Datei
 * an die Methode sendFileMessage weitergegeben.
 */
shareFileButton.addEventListener('change', (event) => {
    let file = event.target.files[0];
    sendFileMessage(file);
});
/**
 * Wenn der sendChatButton getätigt wird, wird die vom Nutzer im Textfeld eingegebene Nachricht
 * an die Methode sendTextMessage weitergegeben.
 */
sendChatButton.addEventListener('click', () => {
    let value = textField.value;
    if (value) {
        sendTextMessage(value);
        textField.value = "";
    }
});

// DATACHANNELS ============================================================
/**
 * In dieser Methode werden die Channel chatChannel und fileChannel für den Raum-Erzeuger initialisiert.
 * 
 * @param {interface} rtcPeerConnection
 */
function setupRoomCreateDataChannel(rtcPeerConnection) {
    chatChannel = rtcPeerConnection.createDataChannel(CHAT_CHANNEL_IDENTIFIER);
    chatChannel.onmessage = receiveChat;

    fileChannel = rtcPeerConnection.createDataChannel(FILE_CHANNEL_IDENTIFIER);
    fileChannel.binaryType = 'arraybuffer';
    fileChannel.onmessage = receiveFile;
}

/**
 * In dieser Methode werden die Channel chatChannel und fileChannel für den Raum-Beitreter initialisiert.
 * Da die Channel bereits beim Raum-Ersteller generiert wurden, 
 * werden auf die bereits bestehenden Channel über die rtcPeerConnection zugegriffen.
 * 
 * @param {interface} rtcPeerConnection
 */
function setupRoomJoinDataChannel(rtcPeerConnection) {
    rtcPeerConnection.ondatachannel = event => {
        let channel = event.channel;
        switch (channel.label) {
            case CHAT_CHANNEL_IDENTIFIER:
                chatChannel = channel;
                chatChannel.onmessage = receiveChat;
                break;
            case FILE_CHANNEL_IDENTIFIER:
                fileChannel = channel;
                fileChannel.onmessage = receiveFile;
                break;
        }
    }
}


// CHAT FUNCTIONS  ============================================================ 
/**
 * Der zu versendende Nachrichtentext wird zu einem JSON-Object hinzugefügt.
 * Das JSON-Object beinhaltet den Namen des Absenders, den Zeitstempel, 
 * die Art der Nachricht (chat) und den Inhalt der Nachricht.
 * Dieses JSON-Object wird an die Methode sendChat weitergegeben.
 * 
 * @param {String} text 
 */
function sendTextMessage(text) {
    let messageObj = {
        senderName: getSenderName(),
        timestamp: Date.now(),
        type: 'chat',
        content: text
    }
    sendChat(messageObj);
}

/**
 * Die zu versendende Datei wird zu einem JSON-Object hinzugefügt und and die Methode sendChat weitergegeben
 * Das JSON-Object beinhaltet den Namen des Absenders, den Zeitstempel, 
 * die Art der Nachricht (file) und den Inhalt der Datei.
 * Der Inhalt der Datei beinhaltet den Dateinamen und die UUID der Datei.
 * 
 * @param {File} file 
 * @returns 
 */
function sendFileMessage(file) {
    //Abbrechen, wenn keine Datei ausgewählt wurde
    if (!file) {
        return;
    }

    //Setzen des Sendernamen
    if(nameInput === undefined && nameInputCreator != undefined){
        nameInput.value = nameInputCreator.value;
    }

    let fileUuid = fileHandler.addFileToDownload(file);
    let fileMessageObj = {
        senderName: getSenderName(),
        timestamp: Date.now(),
        type: 'file',
        content: {
            name: file.name,
            link: fileUuid
        }
    }
    sendChat(fileMessageObj);
}

/**
 * liefert den Namen des Absenders
 * 
 * @returns sender name
 */
function getSenderName(){
    if(nameInput.value.length === 0){
        return nameInputCreator.value;
    }else{
        return nameInput.value;
    }
}

/**
 * parsed die Daten der erhaltenen Nachricht zu JSON.
 * Wenn es sich um eine Chat-Nachricht oder Datei handelt, wird die Herkunft der Nachricht auf 'foreign' gesetzt 
 * und die Nachricht an die Methode sendMessageToChat weitergegeben.
 * Wird eine Datei angefragt, wird über den Filehandler die gewählte Datei zur Verfügung gestellt.
 * 
 * @param {*} event 
 */
function receiveChat(event) {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'chat':
        case 'file':
            message.src = "foreign";
            appendMessageToChat(message);
            break;
        case 'request':
            let requestedFile = message.content;
            if (fileHandler.has(requestedFile)) {
                sendFile(fileHandler.getFile(requestedFile));
            } else {
                console.log("No file available to download: " + requestedFile);
            }
            break;
    }
}

/**
 * gibt die Nachricht an die Methode sendMessage weiter, setzt die Herkunft der Nachricht auf 'own' 
 * und gibt die Nachricht an die Methode appendMessageToChat weiter.
 * @param {JSON} message 
 */
function sendChat(message) {
    sendMessage(message)

    message.src = "own";
    appendMessageToChat(message);
}

/**
 * überträgt die übergebene Nachricht über den Channel chatChannel an den Chatpartner.
 * 
 * @param {JSON} message 
 */
function sendMessage(message) {
    try{
        chatChannel.send(JSON.stringify(message));
    }catch (error) {
        console.error('No Connection', error);
        alert('Es besteht noch keine Verbindung du kannst noch keine Nachrichten schreiben!');
    }
}

/**
 * Diese Methode wird aufgerufen, wenn ein Nutzer eine ihm/ihr zugesandte Datei herunterladen möchte.
 * Erstellt ein JSON-Object mit dem Typ 'request' und der uuid als Inhalt 
 * und übergibt dies an die Methode sendMessage.
 * @param {string} uuid 
 */
function sendFileRequest(uuid) {
    let fileMessageObj = {
        type: 'request',
        content: uuid
    }
    sendMessage(fileMessageObj);
}

/**
 * Die übergebene Nachricht wird dem Chat-Fenster hinzugefügt.
 * Dafür wird zunächst die HTML-Nachricht über die Methode createMessageHTML erzeugt.
 * Wenn es sich bei der Nachricht um eine Datei handelt, wird ein Button zum Herunterladen der Datei erstellt.
 * @param {JSON} message 
 */
function appendMessageToChat(message) {
    chatMessages.innerHTML += createMessageHTML(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (message.type === 'file') {
        let btnDownloadFile = document.getElementById('btn-' + message.content.link);
        btnDownloadFile.addEventListener('click', () => {
            requestedFileName = btnDownloadFile.name;
            receivedBuffers = [];
            sendFileRequest(message.content.link);
        });
    }
}

/**
 * wandelt die übergebene Nachricht in HTML um.
 * Wenn die Nachricht beim Absender dargestellt wird, ist die Herkunft der Nachricht 'own', 
 * beim Emfänger ist dieses 'foreign'. Die eigenen Nachrichten werden im Chat-Fenster rechts, die empfangenen Nachrichten rechts angezeigt.
 * Bei einer Chat-Nachricht wird der Inhalt des JSON-Objects dem Message.body hinzugefügt.
 * Bei Dateien wird der Dateiname und der Link zum Herunterladen dieser dem Body hinzugefügt.
 * In beiden Fällen, werden der Name des Absenders und der Zeitstempel dargestellt.
 * @param {JSON} message 
 * @returns
 */
function createMessageHTML(message) {
    let ownMessage = message.src === 'own';
    let messageBody = `<div class="answer ${ownMessage ? 'right' : 'left'}">`;
    messageBody += `<div class="name">${message.senderName}</div>`;
    switch (message.type) {
        case 'chat':
            messageBody += `<div class="text">${message.content}</div>`;
            break;
        case 'file':
            messageBody += `<div class="text">Datei: ${message.content.name}<br>`;
            messageBody += `<label for="btn-${message.content.link}">${iconPaths.downloadImage}</label>`;
            messageBody += `<input type="button" name="${message.content.name}" id="btn-${message.content.link}" style="display:none !important" /></div>`;
            break;
    }

    messageBody += `<div class="time">${getFormattedTimeFromTimestamp(message.timestamp)}</div>`;
    messageBody += "</div>";

    return messageBody;
}

/**
 * Liefert die Zeit des gegebenen Zeitstempels im Format 'HH:mm'
 * 
 * @param {number} timestamp as number
 * @returns string
 */
function getFormattedTimeFromTimestamp(timestamp) {
    let date = new Date(timestamp);
    let hour = date.getHours();
    let minutes = "0" + date.getMinutes();
    return hour + ":" + minutes.substr(-2);
}

// FILE FUNCTIONS  ============================================================ 

/**
 * überträgt die Datei über den Channel fileChannel an den Chatpartner
 * 
 * @param {File} file 
 * @returns 
 */
async function sendFile(file) {
    if (!file) {
        return;
    }

    const arrayBuffer = await file.arrayBuffer();
    for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
        fileChannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
    }
    fileChannel.send(END_OF_FILE_MESSAGE);
}

/**
 * die übertragende Datei wird mittels arrayBuffers in ein Blob gelesen, bis EOF erreicht ist. 
 * Der Blob und der Name der Datei werden an die Methode downloadFile weitergegeben.
 * @param {*} event 
 */
async function receiveFile(event) {
    const data = event.data;
    try {
        if (data !== END_OF_FILE_MESSAGE) {
            receivedBuffers.push(data);
        } else {
            const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
                const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
                tmp.set(new Uint8Array(acc), 0);
                tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
                return tmp;
            }, new Uint8Array());
            const blob = new Blob([arrayBuffer]);
            downloadFile(blob, requestedFileName);
        }
    } catch (err) {
        console.log('File transfer failed');
    }
}

/**
 * erstellt eine URL für die übergebene Datei (blob), 
 * lädt diese herunter und deaktiviert die ertellte URL anschließend.
 * 
 * @param {Blob} blob 
 * @param {String} fileName 
 */
function downloadFile(blob, fileName) {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove()
}

// EXPORTS  ============================================================ 
export default {
    setupRoomCreateDataChannel,
    setupRoomJoinDataChannel
}