const fileHandler = require('../core/FileHandler');

//create controller function to load the homepage
const loadHome = (req, res) => {
    res.render('index');
}

const load404 = (req, res) => {
    res.status(404).render('404', { title: '404' });
}

const handleDownload = (req, res, next) => {
    const requestedURL = req.params.id;
    if (fileHandler.has(requestedURL)) {
        res.download(fileHandler.getFile(requestedURL));
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