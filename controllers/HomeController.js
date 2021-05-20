const fileHandler = require('../core/FileHandler');

//create controller function to load the homepage
//https://acidtango.com/thelemoncrunch/how-to-implement-a-video-conference-with-webrtc-and-node/
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

const loadConnectionView = (req, res) => {
    res.render('connection', { title: 'Anruf-Details'});
}

const loadUserView = (req, res) => {
    res.render('userView', { title: 'Anruf-View'});
}

//export this function when require
module.exports = {
    loadHome,
    loadConnectionView,
    loadUserView,
    handleDownload,
    load404
}