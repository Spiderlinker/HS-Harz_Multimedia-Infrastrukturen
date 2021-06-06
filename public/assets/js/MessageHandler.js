import fileHandler from './FileHandler.js';

const nameInput = document.getElementById('name');
const nameInputCreator = document.getElementById('name_creator');

const chatMessages = document.getElementById('chat-messages');
const shareFileButton = document.getElementById('select-file-input');
const sendChatButton = document.getElementById('btn-send-chat');
const textField = document.getElementById('chat-field');

const MAXIMUM_MESSAGE_SIZE = 65535;
const END_OF_FILE_MESSAGE = 'EOF';

const CHAT_CHANNEL_IDENTIFIER = "ChatChannel";
const FILE_CHANNEL_IDENTIFIER = "FileChannel";

let chatChannel;
let fileChannel;

let requestedFileName;
let receivedBuffers;

// KEY EVENT LISTENER ============================================================
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

shareFileButton.addEventListener('change', (event) => {
    let file = event.target.files[0];
    sendFileMessage(file);
});

sendChatButton.addEventListener('click', () => {
    let value = textField.value;
    if (value) {
        sendTextMessage(value);
        textField.value = "";
    }
});

// DATACHANNELS ============================================================

function setupRoomCreateDataChannel(rtcPeerConnection) {
    chatChannel = rtcPeerConnection.createDataChannel(CHAT_CHANNEL_IDENTIFIER);
    chatChannel.onmessage = receiveChat;

    fileChannel = rtcPeerConnection.createDataChannel(FILE_CHANNEL_IDENTIFIER);
    fileChannel.binaryType = 'arraybuffer';
    fileChannel.onmessage = receiveFile;
}

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
function sendTextMessage(text) {
    let messageObj = {
        senderName: getSenderName(),
        timestamp: Date.now(),
        type: 'chat',
        content: text
    }
    sendChat(messageObj);
}

function sendFileMessage(file) {
    if (!file) {
        return;
    }

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

function getSenderName(){
    if(nameInput.value.length === 0){
        return nameInputCreator.value;
    }else{
        return nameInput.value;
    }
}

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

function sendChat(message) {
    sendMessage(message)

    message.src = "own";
    appendMessageToChat(message);
}

function sendMessage(message) {
    try{
        chatChannel.send(JSON.stringify(message));
    }catch (error) {
        console.error('No Connection', error);
        alert('Es besteht noch keine Verbindung du kannst noch keine Nachrichten schreiben!');
    }
}

function sendFileRequest(uuid) {
    let fileMessageObj = {
        type: 'request',
        content: uuid
    }
    sendMessage(fileMessageObj);
}

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

function createMessageHTML(message) {

    let downloadImage = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>`;

    let ownMessage = message.src === 'own';
    let messageBody = `<div class="answer ${ownMessage ? 'right' : 'left'}">`;
    messageBody += `<div class="name">${message.senderName}</div>`;
    switch (message.type) {
        case 'chat':
            messageBody += `<div class="text">${message.content}</div>`;
            break;
        case 'file':
            messageBody += `<div class="text">Datei: ${message.content.name}<br>`;
            messageBody += `<label for="btn-${message.content.link}">${downloadImage}</label>`;
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