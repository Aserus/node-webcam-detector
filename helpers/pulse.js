const EventEmitter = require('events');

class Pulse extends EventEmitter{
	constructor(opt){
		super();
		this.value = 0;
		this.options = opt || {};
		this.level = 0;

		this.options.threshold = this.options.threshold || 100;
		this.options.decrease = this.options.decrease || 10;
		this.options.decreaseTime = this.options.decreaseTime || 1000;
		this.options.max = this.options.max || 500;
	}

	pull(v = 1){
		this.value+= v;
		if(this.value > this.options.max){
			this.value = this.options.max;
		}

		this.checkValue();

		if(!this.timer)	this.processStart()
	}
	checkValue(){
		if(this.level===0 && this.value >= this.options.threshold){
			this.level = 1;
			this.emit('rose')
		}else if(this.level===1 && this.value < this.options.threshold){
			this.level = 0;
			this.emit('decreased')
		}
		if(this.value<=0){
			this.value = 0;
			clearInterval(this.timer)
			this.timer = null;
		}
	}
	isUp(){
		return this.level===1;
	}
	processStart(){
		this.timer = setInterval(()=>this.process(),this.options.decreaseTime);
	}
	process(){
		this.value -= this.options.decrease;
		this.checkValue();
	}
}



module.exports = Pulse;
