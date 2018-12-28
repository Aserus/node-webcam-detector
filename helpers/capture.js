const WebcamCapture = require('./webcam-capture');

const cv = require('opencv4nodejs');

const wCap = new WebcamCapture({
	frame_rate: process.env.VIDEO_FRAME_RATE,
	detectMotion:true
});

/*
wCap.on('frame', frame => {
	//console.log('frame');

})
*/
wCap.start();




module.exports = wCap




process.on('SIGINT', ()=> {
	wCap.destroy();
	process.exit();
});
