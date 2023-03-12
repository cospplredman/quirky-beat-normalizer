let audioFile;
let osuFile;
let timingPoints = [];
let targetBPM = 180;
let targetMSPB = 400;

function download(url){
	var a = document.createElement('a');
	a.href = url;
	a.download = "audio.webm";
	a.click();
}

function parseOsu(){
	osuFile.text().then((v)=>{
		let tp = v.match(/\[TimingPoints\][^\[]+/)[0].trim().split("\r\n").slice(1);

		timingPoints = tp.map((v)=>{
			return v.split(",").map((v)=>{
				return +v;
			});
		}).filter((v)=>v[1]>=0);


	});
}

function waitUntil(m){
	while(performance.now() < m);
}

function runWhen(fn, ms){
	let delfn = () => {
		waitUntil(ms);
		fn();
	}

	//shutup
	let delay = ms - performance.now();
	if(delay > 500){
		console.log("wait too long: settimeout", delay - 500);
		setTimeout(delfn, delay - 500);
	}else{
		setTimeout(delfn, 1);
	}
}

async function start(){
	let ctx = new AudioContext();
	let audio = new Audio(URL.createObjectURL(audioFile));
	let dest = ctx.createMediaStreamDestination();
	let src = ctx.createMediaElementSource(audio);
	let recorder = new MediaRecorder(dest.stream, {mimeType: "audio/webm"});

	let chunks = [];

	recorder.ondataavailable = (ev) => {
		chunks.push(ev.data);
	};

	recorder.onstop = (ev) => {
		let blob = new Blob(chunks, {type: "audio/webm" });
		console.log(URL.createObjectURL(blob)); //TODO download button
	};

	audio.onended = (ev) => {
		recorder.stop();
	};

	let i = 0;
	let sttime = 0;
	let etime = 0;
	let fn = () => {
		let tmspb = targetMSPB;
		let mspb = timingPoints[i][1];
		audio.playbackRate = mspb/tmspb;
		i++;

		if(i < timingPoints.length){
			let delay = (timingPoints[i][0] - timingPoints[i-1][0])/mspb*tmspb;
			etime += delay;
			console.log(etime - audio.currentTime*1000, delay, timingPoints[i]);
			runWhen(fn, sttime + etime);
		}
	};

	audio.oncanplay = (ev) => {
		src.connect(dest);
		recorder.start();
		audio.play().then((v)=>{
			sttime = performance.now();
			etime += timingPoints[i][0];
			runWhen(fn, sttime + etime);
		});
		console.log(recorder, audio);
	};

	audio.ontimeupdate = (ev) => {
		console.log((100*audio.currentTime/audio.duration) | 0);
	};
}
