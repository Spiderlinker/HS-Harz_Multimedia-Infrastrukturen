const net = require('net');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const fileHandler = require('./FileHandler');

const PATH_MESSAGES = 'public/assets/files/messages.json';
const MESSAGE_PORT = 3001;

/*
- Weiterer (Server) Port für Video und Audioübertragung?;
- Dieser Server (3001) dauerhaft laufend oder erst starten, wenn Verbindung zu anderem Nutzer aufgebaut werden soll?
- NAT/SipJS?
*/

class Session {
    constructor(localAddress, username, remoteAddress) {
        this.username = username;
        this.remoteAddress = remoteAddress;
        this.sessionId = uuid.v4();

        this.clearMessages();

        this.createServer();
        this.startServer();

        this.createClient();
    }

    createServer() {
        this.server = net.createServer(conn => {
            console.log("Client connected to server...");

            conn.on('end', () => {
                console.log("Client disconnected!");
            });

            conn.on('data', data => {
                let dataAsJson = JSON.parse(data);
                dataAsJson.src = 'foreign';
                this.addMessage(dataAsJson);
            });
        });
    }

    startServer() {
        this.server.listen(MESSAGE_PORT, this.host, () => {
            console.log(`MessagesServer listening on ${MESSAGE_PORT}:${MESSAGE_PORT}`);
        });
    }

    createClient() {
        this.client = net.Socket();
        this.client.on('close', () => {
            console.log('Server closed connection!')
        });
        this.client.on('error', err => {
            console.log(err);
        });
    }

    disconnect() {
        this.server.close();
    }

    getSessionID() {
        return sessionId;
    }

    getMessages() {
        return this.messages;
    }

    sendTextMessage(text) {
        let messageObj = {
            senderID: this.sessionId,
            senderName: this.username,
            timestamp: Date.now(),
            type: 'chat',
            content: text
        }
        this.sendMessage(messageObj);
    }

    sendFileMessage(filePath) {
        let fileUuid = fileHandler.addFileToDownload(filePath);
        let fileMessageObj = {
            senderID: this.sessionId,
            senderName: this.username,
            timestamp: Date.now(),
            type: 'file',
            content: {
                name: path.basename(filePath),
                link: '/download/' + fileUuid
            }
        }
        this.sendMessage(fileMessageObj);
        return fileUuid;
    }

    sendMessage(message) {
        message.src = 'own';
        this.addMessage(message);
        this.client.connect(MESSAGE_PORT, this.remoteAddress, () => {
            this.client.write(JSON.stringify(message));
            this.client.end();
        });
    }

    clearMessages() {
        // Nachrichtendatei leeren
        fs.writeFile(PATH_MESSAGES, JSON.stringify([]), 'utf8');
    }

    addMessage(message) {
        fs.readFile(PATH_MESSAGES, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            // Bereits existierende Nachrichten aus Datei lesen
            let messages = JSON.parse(data);
            // Neue Nachricht anhängen
            messages.push(message);
            // Alle Nachrichten wieder in die Datei schreiben
            let json = JSON.stringify(messages);
            fs.writeFile(PATH_MESSAGES, json, 'utf8', () => console.log("Message saved"));
        });
    }
}


// class Server {
//     constructor(host, port) {
//         this.host = host;
//         this.port = port;

//         this.server = net.createServer(conn => {
//             console.log("Client connected to server...");

//             conn.on('end', () => {
//                 console.log("Client disconnected!");
//             });

//             conn.on('data', data => {
//                 console.log("Client is sending data:");
//                 let dataAsJson = JSON.parse(data);


//                 console.log(dataAsJson);
//             });
//         });
//     }

//     startServer() {
//         this.server.listen(this.port, this.host, () => {
//             console.log(`MessagesServer listening on ${this.host}:${this.port}`);
//         });
//     }

//     stopServer() {
//         this.server.close();
//     }
// }
module.exports = Session;