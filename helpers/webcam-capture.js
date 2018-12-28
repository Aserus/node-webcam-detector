const EventEmitter = require('events');
const cv = require('opencv4nodejs');
const pause = require('./pause');


async function prepareFrame(frame){
	let mat = frame.copy();
	mat = mat.cvtColor(cv.COLOR_BGR2GRAY);
	mat = mat.gaussianBlur(new cv.Size(5, 5), 0);
	return mat
}

async function deltaTrashFrame(frame,lastFrame){
	if(!lastFrame) return frame;

	let mat = await prepareFrame(frame)
	let mat2 = await prepareFrame(lastFrame)

	let frameDelta = mat2.absdiff(mat)
	let thresh = frameDelta.threshold(25, 255, cv.THRESH_BINARY)

	let sqKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
	thresh = await thresh.dilateAsync(sqKernel,new cv.Point(0, 0), 2)

	return thresh;
}


class WebcamCapture extends EventEmitter{
	constructor(opt){
		super();

		this.options = opt || {};

		this.options.frame_rate = this.options.frame_rate ? Math.min(Number(this.options.frame_rate),30) : 10;


		this.wCap = new cv.VideoCapture(0);

		//this.wCap.set(cv.CAP_PROP_FRAME_WIDTH,800)
		//this.wCap.set(cv.CAP_PROP_FRAME_HEIGHT,600)
		this.wCap.set(cv.CAP_PROP_FRAME_WIDTH,320)
		this.wCap.set(cv.CAP_PROP_FRAME_HEIGHT,240)
		this.wCap.set(cv.CAP_PROP_FPS,this.options.frame_rate);

		this.isWork = false;

	}


	async frame(){
		try{
			let frame = await this.wCap.readAsync();
			if (frame.empty) {
				this.wCap.reset();
				frame = await this.wCap.readAsync();
			}
			return frame
		}catch(err){ }
		return null;
	}

	start(){
		this.isWork = true;
		this.processCapture();
		if(this.options.detectMotion) this.startDetect()
	}

	async stop(){
		this.isWork = false;
	}

	async processCapture(){
		const frame = await this.frame()
		if(frame){
			this.frameLast = frame;
			this.emit('frame',frame);
		}
		if(this.isWork)	this.processCapture()
	}

	async processDetect(){
		if(this.frameLast){
			let frameCurr = await this.frameLast.copyAsync();
			frameCurr = await frameCurr.resizeToMaxAsync(240)

			if(this.framePrev){
				let rects = await this.findMotion(this.framePrev,frameCurr);
				if(rects.length>0){
					
				}
			}
			this.framePrev = frameCurr;
		}
		setTimeout(()=>this.processDetect(),100);
	}

	startDetect(){	this.processDetect();	}

	destroy(){	this.wCap.release()	}

	async findMotion(prev,curr){
		let tresh = await deltaTrashFrame(prev,curr);

		const contourList = tresh.findContours(cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);

		let dArea = (curr.cols * curr.rows ) / 100 * 5;

		let rects = [];
		for(let cnt of contourList){
			let rect = cnt.boundingRect();
			let rectArea = (rect.width * rect.height );
			if(rectArea > dArea)	rects.push(rect);
		}

		if(rects.length){
			this.emit('detect:motion',curr,rects,tresh)
		}
		return rects;
	}


}


module.exports = WebcamCapture;
