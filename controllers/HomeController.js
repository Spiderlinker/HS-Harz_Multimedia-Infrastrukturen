
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

//create controller function to load the homepage
const loadHome = (req, res) => {
    res.render('index');
}

const load404 = (req, res) => {
    res.status(404).render('404', { title: '404' });
}


const handleDownload = (req, res, next) => {
    const requestedURL = req.params.id;
    if (fileMap.has(requestedURL)) {
        let requestedFile = fileMap.get(requestedURL);
        res.download(requestedFile);
    } else {
        next();
    }
}


//export this function when require
module.exports = {
    loadHome,
    handleDownload,
    load404
}