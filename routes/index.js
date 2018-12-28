const express = require('express');
const fs = require('mz/fs');
const router = express.Router();

const wCap = require('../helpers/capture');



const cv = require('opencv4nodejs');



router.get('/', async (req, res) => {
  res.send('Hello World!');
});


router.get('/videos', async (req, res, next) => {

	let videoList = await fs.readdir('./public/videos');

	videoList = videoList.filter(item=>(item.indexOf('.mp4')>=0))
	videoList = videoList.reverse()

  res.render('videos', { videoList });
});




router.get('/snapshot.jpg', async (req, res) => {
	if(!wCap.frameLast) throw new Error('frame not found');

	const frame = wCap.frameLast;

	const data = cv.imencode('.jpg', frame).toString('base64');
	const img = Buffer.from(data, 'base64');

	res.writeHead(200, {
		'Content-Type': 'image/jpeg',
		'Content-Length': img.length
	});
	res.end(img);
});




router.use((err, req, res, next) => {
	res.status(err.status || 500)
	res.end(err.message);
});



module.exports = router;
