//create controller function to load the homepage
const loadHome = (req, res) => {
    res.render('index');
}

const load404 = (req, res) => {
    res.render('404', { title: '404'});
}

//export this function when require
module.exports = {
    loadHome,
    load404
}