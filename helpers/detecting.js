const wCap = require('./capture');
const Pulse = require('./pulse');
const pad = require('./pad');
const pause = require('./pause');
const tempdir = require('tempdir');
const path = require('path');
const moment = require('moment');
const cv = require('opencv4nodejs');
const fs = require('mz/fs');
const rimraf = require('rimraf');
//const mkdirp = require('mkdirp');


const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const deltaVideo = 30;

let timemark = null;


function onProgress(progress){
 if (progress.timemark != timemark)  timemark = progress.timemark;
 console.log('Time mark: ' + timemark + "...");
}

function onError(err, stdout, stderr) { console.log('Cannot process video: ' + err.message);	}
function onEnd() { console.log('Finished processing');	}





const pulse = new Pulse({
	threshold: 40,
	decrease:30,
	max: 300
});

let recordTimer;
let isRecord = false;
const frameList = [];

let recordFrameList = null;

function addFrame(f){
	frameList.push(f)

	if(frameList.length > 120){
		 frameList.shift();
	 }
}

function addRecordFrame(frame){
	recordFrameList.push(frame)
}

function isDetectTime(){
	const now = moment();
	const morning = moment();
	morning.hours(9)
	morning.minutes(0)
	morning.seconds(0)

	const vech = moment();
	vech.hours(17)
	vech.minutes(0)
	vech.seconds(0)

	if(now.isBetween(morning,vech)) return false;
	return true
}
console.log('isDetectTime',isDetectTime());

function startRecord(){
	if(isRecord) return false;
	if(!isDetectTime()) return false;
	isRecord = true;
	recordFrameList = [];
	frameList.forEach(item=> recordFrameList.push(item));

	wCap.on('frame',addRecordFrame)


	recordTimer = setTimeout(stopRecord,deltaVideo*1000);
}

async function stopRecord(){
	if(pulse.isUp()) {
		console.log('prolong record')
		await pause(deltaVideo*1000)
		console.log('prolong end')
	}
	clearTimeout(recordTimer);
	wCap.off('frame',addRecordFrame);
	recordTimer = false;

	saveRecord(recordFrameList);
	recordFrameList = null;
	isRecord = false;
	console.log('stop Record')
}

async function saveRecord(list){
	let folder = await tempdir();
	//console.log(folder);
	const prefixS = 'img_';
	const ext = '.jpg';

	let i = 0;
	for(let frame of list){
		let fn = prefixS+pad(i,4)+ext;
		await cv.imwriteAsync(path.join(folder,fn),frame);
		i++;
	}

	const fileList = await fs.readdir(folder);
	console.log(fileList.length);

	let fnTmpl = path.join(folder,prefixS+'%04d'+ext);


	let fnVideo = moment().format("YYYY-MM-DD--HH-mm-ss")

	ffmpeg()
		.on('end', onEnd )
		.on('end', ()=>{
			rimraf(folder, ()=>{ console.log('done'); });
		})
		.on('progress', onProgress)
		.on('error', onError)
		.input(fnTmpl)
		.inputFPS(25)
		.output('./public/videos/'+fnVideo+'.mp4')
		.outputFPS(25)
		.noAudio()
		.run();
	console.log('save Record')
}


wCap.on('frame',(frame)=>{
	addFrame(frame)
})


wCap.on('detect:motion',()=>{
	pulse.pull(10);
	//console.log(pulse.value);//.pulse(10);
})


pulse.on('rose',()=>{
	console.log('LOH DETECTED');
	startRecord()
})
