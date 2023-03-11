let audioFile;
let osuFile;
let audioElement = document.getElementById("player");
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

function waitms(m){
	let st = performance.now();
	while(performance.now()-st < m);
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
	}

	recorder.onstop = (ev) => {
		let blob = new Blob(chunks, {type: "audio/webm" });
		audioElement.src = URL.createObjectURL(blob);
	}

	audio.onended = (ev) => {
		recorder.stop();
	}

	let start;
	let sttime, i = 0;
	let delay = timingPoints[i][0];
	let fn = () => {
		let ct = performance.now();
		let dt = ct - sttime;
		sttime = ct;

		let wt = delay - dt;
		waitms(wt);

		//let tmspb = 60000/targetBPM;
		let tmspb = targetMSPB;
		let mspb = timingPoints[i][1];
		audio.playbackRate = mspb/tmspb;
		i++;

		if(i < timingPoints.length){
			delay = (timingPoints[i][0] - timingPoints[i-1][0])/mspb*tmspb;
			console.log(delay, ct - start, audio.currentTime*1000);

			if(delay > 500)
				setTimeout(fn, delay - 500);
			else
				setTimeout(fn, 1);
		}
	}

	audio.oncanplay = (ev) => {
		src.connect(dest);
		recorder.start();
		audio.play().then((v)=>{
			start = sttime = performance.now();
			setTimeout(fn, 1);
		});
		console.log(recorder, audio);
	}

	audio.ontimeupdate = (ev) => {
		console.log((100*audio.currentTime/audio.duration) | 0);
	}
}
