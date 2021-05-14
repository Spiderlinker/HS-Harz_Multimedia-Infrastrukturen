const uuid = require('uuid');

/**
 * Map beinhaltet alle zum Download freigegebenen Dateien.
 * Diese werden über ein Key-Value-Prinzip in der Map abgelegt.
 * Hierbei wird als Key eine einzigartige ID erzeugt, über die 
 * die Datei abgerufen werden kann. Der Value ist der Pfad der 
 * freigegenen Datei.
 */
const fileMap = new Map();

/**
 * Diese Methode fügt der fileMap die als Parameter gegebene Datei hinzu.
 * Hierfür wird für die Datei eine uuid erzeugt, unter der die Datei in 
 * der fileMap abgelegt wird. Diese uuid wird von der Methode zurückgegeben.
 * 
 * Diese uuid wird benötigt, um später auf die Datei zuzugreifen oder
 * die Datei von der Freigabe zu entfernen.
 * 
 * @param {string} filePath Pfad zu der Datei, die freigegeben werden soll
 * @returns ID der Datei
 */
function addFileToDownload(filePath) {
    let filePathAssociatedID = uuid.v4();
    fileMap.set(filePathAssociatedID, filePath);
    return filePathAssociatedID;
}

/**
 * Diese Methode entfernt die Datei von der Freigabe, die der gegebenen uuid
 * zugeordnet ist. Hierbei wird das Key-Value-Paar aus der fileMap entfernt,
 * die den Key der gegebenen uuid besitzt.
 * 
 * Ohne die zur Datei zugehörige uuid kann die gewünschte Datei nicht aus
 * der Freigabe entfernt werden. 
 * 
 * >> TODO << Sollte hier ein Entfernung der Datei auch über den Dateinamen möglich sein?
 * 
 * @param {string} fileUuid uuid der Datei, die nicht mehr freigegeben werden soll
 * @returns void
 */
function removeFileToDownload(fileUuid) {
    return fileMap.delete(fileUuid);
}

/**
 * Liefert einen boolean der angibt, ob der gegebene Key (UUID) 
 * existiert bzw. einer Datei zugordnet ist.
 * 
 * @param {string} fileUuid Key 
 * @returns true, falls es den gegebenen Key gibt; false andernfalls
 */
function has(fileUuid) {
    return fileMap.has(fileUuid);
}

/**
 * Liefert den Pfad zu der Datei, die der gegebenen UUID zugeordnet ist.
 * Falls keine Datei unter der UUID hinterlegt sein sollte, so wird 'undefined' zurückgegeben.
 * 
 * @param {string} fileUuid der Datei, dessen Pfad ermittelt werden soll
 * @returns Pfad zu der Datei, die der gegebenen UUID zugeordnet ist
 */
function getFile(fileUuid) {
    return fileMap.get(fileUuid);
}

/**
 * Löscht alle zum Download freigegebenen Dateien.
 */
function clear() {
    fileMap.clear();
}

module.exports = {
    has,
    getFile,
    clear,
    addFileToDownload,
    removeFileToDownload
}