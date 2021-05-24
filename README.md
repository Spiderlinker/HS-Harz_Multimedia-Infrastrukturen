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


## License
Copyright (c) 2014, The WebRTC project authors. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

    Neither the name of Google nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
