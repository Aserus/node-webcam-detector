require('dotenv').config()
const express = require('express');
require('express-async-errors');

const colors = require('colors/safe');
const humanize = require('humanize');


/*
const logMemory = function(){
	let memory = process.memoryUsage();
	console.log(colors.grey("# Memory usage: ") + colors.cyan(humanize.filesize(memory.heapUsed) + " / " + humanize.filesize(memory.heapTotal)));
}
setInterval(logMemory,3000);

*/


const app = express();

app.set('views', './views')
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(require('./routes'));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('Listening on port',PORT);
});

require('./socket')(server);


require('./helpers/detecting');
