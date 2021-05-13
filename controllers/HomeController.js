const uuid = require('uuid');

const fileMap = new Map();

function addFileToDownload(filePath) {
    let filePathAssociatedID = uuid.v4();
    fileMap.set(filePathAssociatedID, filePath);
    return filePathAssociatedID;
}

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


const handleDownload = (req, res) => {
    let requestedURL = req.url.replace('/download/', '');

    console.log("has: " + requestedURL + ": " + fileMap.has(requestedURL));
    if (!fileMap.has(requestedURL)) {
        load404(req, res);
        return;
    }

    let requestedFile = fileMap.get(requestedURL);
    res.download(requestedFile);
}


//export this function when require
module.exports = {
    loadHome,
    handleDownload,
    load404
}