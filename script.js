

let audioFile;
let osuFile;
let audioElement = document.getElementById("player");
let timingPoints = [];
let targetBPM = 180;
let targetMSPB = 400;

function file2url(f){
	     return URL.createObjectURL(f);
}

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

function record(){
	let ctx = new AudioContext();
	let audio = new Audio(file2url(audioFile));
	console.log(audio);
	let dest = ctx.createMediaStreamDestination();
	let src = ctx.createMediaElementSource(audio);
	src.connect(dest);
	let recorder = new MediaRecorder(dest.stream, {mimeType: "audio/webm"});

	let chunks = [];

	recorder.ondataavailable = (ev) => {
		chunks.push(ev.data);
	}

	recorder.onstop = (ev) => {
		let blob = new Blob(chunks, {type: "audio/webm" });
		audioElement.src = URL.createObjectURL(blob);
	}

	audio.onended = (ev) => {
		recorder.stop();
	}



	let prevst = 0;
	let ctp = 0;
	let fn = () => {
		prevst = timingPoints[ctp][0];
		let ctime = audio.currentTime * 1000;
		let tpms = timingPoints[ctp][0];
		//console.log(deltat);

		let wt = prevst - ctime;
		let st = performance.now();
		while(performance.now()-st < wt);
		//let tmspb = 60000/targetBPM;
		let tmspb = targetMSPB;
		let mspb = timingPoints[ctp][1];
		audio.playbackRate = mspb/tmspb;
		console.log(ctime + performance.now() - st, timingPoints[ctp], tmspb, mspb, mspb/tmspb);
		ctp++;
		
		if(ctp == timingPoints.length)
			return;

		let nextTimeout = timingPoints[ctp][0] - prevst - 40;
		if(nextTimeout < 0)
			nextTimeout = 0;

		setTimeout(fn, nextTimeout);
	}

	recorder.start();
	audio.play();
	setTimeout(fn, timingPoints[ctp][0] - prevst - 40);
}
