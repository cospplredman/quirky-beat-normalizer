

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

function waitms(m){
	let st = performance.now();
	while(performance.now()-st < m);
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



	let dur = audio.duration * 1000;

	recorder.start();
	audio.play();
	let sttime = performance.now();
	let ptpms = 0;
	let i = 0;
	let fn = () => {
		let dt = performance.now() - sttime;
		let tpms = timingPoints[i][0];
		prevst = timingPoints[i][0];

		let wt = (tpms - ptpms - dt)/audio.playbackRate;
		ptpms = tpms;
		waitms(wt);

		//let tmspb = 60000/targetBPM;
		let tmspb = targetMSPB;
		let mspb = timingPoints[i][1];
		audio.playbackRate = mspb/tmspb;
		console.log(audio.currentTime, timingPoints[i], tmspb, mspb, mspb/tmspb);
		i++;
		sttime = performance.now();
		if(i < timingPoints.length)
			setTimeout(fn, 1);
	}
	setTimeout(fn, 1);
}
