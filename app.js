/*------third party imports------------------------------------------------------------------------*/

//for request and response handling
const express = require('express');
const app = express();
//Middleware for logging purposes
const morgan = require('morgan');

const server = require('http').createServer(app)
const io = require('socket.io')(server)


/*------end third party imports--------------------------------------------------------------------*/

/*------import Controllers here--------------------------------------------------------------------*/

const conBasePath = './controllers/'

const homeController = require(conBasePath + 'HomeController');
const callController = require(conBasePath + 'CallController');

/*------end Controllers ---------------------------------------------------------------------------*/

/*------Base Configuration-------------------------------------------------------------------------*/


//register view engine - ejs for managing views
app.set('view engine', 'ejs');
//set base path for views
app.set('views', 'resources/views');
//start listen on request on localhost:3000 / 127.0.0.1:3000
const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

//give access to an static folder / public folder / for css files or other public files
app.use(express.static('public'));
//enable urlencode to handle post requests
app.use(express.urlencoded({ extended: true }));

/*------End Base Configuration----------------------------------------------------------------------*/

/*------Middleware section--------------------------------------------------------------------------*/

//Adjust logs for debugging purposes
app.use(morgan('dev'));

/*------End Middleware section----------------------------------------------------------------------*/

/*------Handle Route requests-----------------------------------------------------------------------*/

app.get('/', homeController.loadHome);
app.get('/download/:id', homeController.handleDownload);

app.get('/connection', homeController.loadConnectionView);

app.post('/call', homeController.loadUserView);

io.on('connection', callController.handleSocketConnection);

app.use(homeController.load404);


/*------End Handle Route requests-------------------------------------------------------------------*/

