const socketIO = require('socket.io')

const wCap = require('../helpers/capture');
const cv = require('opencv4nodejs');


module.exports = function (server) {
	const io = socketIO(server);

	io.on('connection', socket => {
		console.log('io connection');


		function streamVideo(frame){
			const data = cv.imencode('.jpg', frame.resizeToMax(200)).toString('base64');
			socket.emit('stream frame base64',data)
		}

		function streamMotion(frame,rects,tresh){
			const data = cv.imencode('.jpg', tresh).toString('base64');
			//socket.emit('stream frame base64',data)
		}

		wCap.on('detect:motion',streamMotion)
		wCap.on('frame',streamVideo);



		socket.on('disconnect', () => {
			console.log('io disconnect');

			wCap.off('detect:motion',streamMotion)
			wCap.on('frame',streamVideo);
		});

	});

}
