const PATH_MESSAGES = '/assets/files/messages.json';

const MESSAGE_REFRESH_RATE = 2500;
const HTML_MESSAGE_CONTAINER = "#chat-messages";

function waitForMsg() {
    $.getJSON(PATH_MESSAGES, data => {

        // Für jede Nachricht soll ein entsprechendes HTML-Element erzeugt werden
        let messages = [];
        for (let message of data) {
            messages.push(createMessageHTML(message));
        }

        // Prüfen, ob der Chat aktualisiert werden muss.
        // Hierzu wird der aktuelle Inhalt des Chats geholt
        // und mit dem neu generierten Chatinhalt (mit den aktuell vorhandenen Nachrichten)
        // Falls beide identisch sind, gab es keine neuen Nachrichten und der Chat
        // muss nicht aktualisiert werden
        let currentChatContent = $(HTML_MESSAGE_CONTAINER).html();
        let newChatContent = messages.join("");

        if (currentChatContent != newChatContent) {
            // Nachrichten im dafür vorgesehenen Feld platzieren
            $(HTML_MESSAGE_CONTAINER).html(newChatContent);

            console.log($(HTML_MESSAGE_CONTAINER).html());

            // Im Chatfenster nach ganz unten scrollen zur neusten Nachricht
            let chatDiv = $(HTML_MESSAGE_CONTAINER);
            chatDiv.scrollTop(chatDiv[0].scrollHeight);
        }

        // Nächste Prüfung auf neue Nachrichten in 2,5 Sekunden
        setTimeout(waitForMsg, MESSAGE_REFRESH_RATE);
    });
};

function createMessageHTML(message) {

    let ownMessage = message.src === 'own';
    let messageBody = `<div class="answer ${ownMessage ? 'right' : 'left'}">`;
    //messageBody += '<div class="avatar">';
    // messageBody += '<img src="https://bootdey.com/img/Content/avatar/avatar2.png" alt="User name" />';
    // messageBody += '<div class="status online"></div>';
    // messageBody += '</div>';
    messageBody += `<div class="name">${message.senderName}</div>`;
    switch (message.type) {
        case 'chat':
            messageBody += `<div class="text">${message.content}</div>`;
            break;
        case 'file':
            messageBody += `<div class="text">Datei: ${message.content.name}<br>`;
            // TODO Downlaod Link anpassen, sodass dieser auf die IP-Adresse des anderen Benutzers zeigt, von dem die Datei heruntergeladen werden soll
            messageBody += `<a target="_blank" href="${message.content.link}">Downlaod</a></div>`;
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