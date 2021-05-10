/*------third party imports------------------------------------------------------------------------*/

//for request and response handling
const express = require('express');
//Middleware for logging purposes
const morgan = require('morgan');

/*------end third party imports--------------------------------------------------------------------*/

/*------import Controllers here--------------------------------------------------------------------*/

const conBasePath = './controllers/'

const homeController = require(conBasePath+'homeController');

/*------end Controllers ---------------------------------------------------------------------------*/

/*------Base Configuration-------------------------------------------------------------------------*/

const app = express();
//register view engine - ejs for managing views
app.set('view engine', 'ejs');
//set base path for views
app.set('views', 'resources/views');
//start listen on request on localhost:3000 / 127.0.0.1:3000
app.listen(3000);
//give access to an static folder / public folder / for css files or other public files
app.use(express.static('public'));
//enable urlencode to handle post requests
app.use(express.urlencoded({ extended: true}));

/*------End Base Configuration----------------------------------------------------------------------*/

/*------Middleware section--------------------------------------------------------------------------*/

//Adjust logs for debugging purposes
app.use(morgan('dev'));

/*------End Middleware section----------------------------------------------------------------------*/

/*------Handle Route requests-----------------------------------------------------------------------*/

app.get('/', homeController.loadHome);

app.use(homeController.load404);

/*------End Handle Route requests-------------------------------------------------------------------*/