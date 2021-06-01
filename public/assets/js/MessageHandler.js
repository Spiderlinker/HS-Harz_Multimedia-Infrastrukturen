import fileHandler from './FileHandler.js';

const nameInput = document.getElementById('name');
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
        // senderID: sessionId,
        senderName: nameInput.value,
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
    let fileUuid = fileHandler.addFileToDownload(file);
    let fileMessageObj = {
        senderName: nameInput.value,
        timestamp: Date.now(),
        type: 'file',
        content: {
            name: file.name,
            link: fileUuid
        }
    }
    sendChat(fileMessageObj);
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
    chatChannel.send(JSON.stringify(message));
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

    let ownMessage = message.src === 'own';
    let messageBody = `<div class="answer ${ownMessage ? 'right' : 'left'}">`;
    messageBody += `<div class="name">${message.senderName}</div>`;
    switch (message.type) {
        case 'chat':
            messageBody += `<div class="text">${message.content}</div>`;
            break;
        case 'file':
            messageBody += `<div class="text">Datei: ${message.content.name}<br>`;
            messageBody += `<input type="button" name="${message.content.name}" id="btn-${message.content.link}" value="Herunterladen"></div>`;
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