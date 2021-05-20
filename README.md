# Node-JS Anwendung

## Node Installation
Hier geht es zum Node.js [Download](https://www.google.com)  
Dokumentation  der Installation [Node.js](https://www.google.com)

## Hilfreiche Kurse
Node.js [Video-Kurs](https://www.youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU)

## Empfohlene Pakete
Globale Installation von Nodemon: ```npm install -g nodemon```
Dokumentation  von [nodemon](https://www.npmjs.com/package/nodemon)

## Starten der Anwendung
Achtung: Die nachfolgenden Befehle müssen im Anwendungspfad des Terminal ausgeführt werden.

Module der Anwendung installieren: ```npm install```  
Lokale Webanwendung starten: ```nodemon app``` oder ```node app```   
Aufruf der Anwendung über 127.0.0.1:3000 - [Anwendung](http://127.0.0.1:3000)

## Fehler beim Starten via nodemon
### Fehlerfall:

```
nodemon : Die Datei "C:\Users\Oliver\AppData\Roaming\npm\nodemon.ps1" kann nicht geladen werden, da die Ausführung von Skripts auf diesem System deaktiviert ist. Weitere Informationen finden Sie unter 
"about_Execution_Policies" (https:/go.microsoft.com/fwlink/?LinkID=135170).
In Zeile:1 Zeichen:1
+ nodemon
+ ~~~~~~~
    + CategoryInfo          : Sicherheitsfehler: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

### Erläuterung & Fehlerbehebung
Unter Windows ist das Ausführen von Skripten (nodemon) in der Powershell standardmäßig deaktiviert. Falls man den Befehl ```nodemon app``` ausführen möchte, muss man entweder das Ausführen von Skripten in der PS erlauben oder diesen Befehl in der 'normalen' cmd ausführen.

Hinweis zum Aktivieren von Skripten in PS: [https://dev.to/tradecoder/how-to-fix-error-nodemon](https://dev.to/tradecoder/how-to-fix-error-nodemon-ps1-cannot-be-loaded-because-running-scripts-is-disabled-on-this-system-34fe)

Alternativ in VS Code statt eines Powershell-Terminals ein 'Command Prompt'-Terminal erzeugen und dort die Befehle ausführen
