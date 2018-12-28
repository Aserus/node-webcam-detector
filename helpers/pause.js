module.exports = timer => {
	return new Promise((resolve,reject)=>{
		setTimeout(()=>resolve(), timer)
	})
}
