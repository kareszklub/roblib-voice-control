import { SpeechClient } from '@google-cloud/speech';
import { config as dotenv } from 'dotenv';
import recorder from 'node-record-lpcm16';

dotenv();

process.env['GOOGLE_APPLICATION_CREDENTIALS'] ||= './google_credentials.json';

const client = new SpeechClient();
const sampleRateHertz = 16000,
	request = {
		config: {
			encoding: 'LINEAR16' as 'LINEAR16', // bruh momentum
			sampleRateHertz: sampleRateHertz,
			languageCode: 'en-US',
		},
		interimResults: false,
	};

/**
	```plain
	COMMANDS' SYNTAX

	MOVE: move [seconds] seconds with speed [0..100]
	TURM: turn [left | right] for [seconds] seconds with speed [0..100]
	BUZZ: buzz [seconds] seconds with frequency [0..100]
	LED:  turn led [red | green | blue]
	```node-record-lpcm16
*/
const commands = [
	{
		name: 'move',
		regex: /move (\d+) seconds? with speed (\d{1,3})/
	},
	{
		name: 'turn',
		regex: /turn ((?:left)|(?:right)) for (\d+) seconds? with speed (\d{1,3})/
	},
	{
		name: 'led',
		regex: /turn led ((?:red)|(?:green)|(?:blue))/
	},
	{
		name: 'buzz',
		regex: /buzz (\d+) seconds? with frequency (\d{1,3})/
	},
	{
		name: 'stop',
		regex: /stop/
	},
	{
		name: 'explosive_diarrhea',
		regex: /explosive diarrhea/
	},
];

const tryCommand = (text: string) => {
	let rArr: string[];

	const cmd = commands.find(c => {
		const res = c.regex.exec(text);
		if (!res)
			return false;

		[, ...rArr] = res;

		return true;
	});

	if (!cmd)
		return false;
	
	console.log(`Matched command '${cmd.name}'`);

	return true;
};

const handleTranscript = (data: any) => {
	if (data.results) {

		const alt = data.results[0].alternatives[0], transcript = alt.transcript
			.toString()
			.trim()
			.toLowerCase();
		
		console.log(`Received '${transcript}' with confidence ${alt.data}`);

		tryCommand(transcript);
	} else
		console.log('Something went wrong');
};

const recognizeStream = client
	.streamingRecognize(request)
		.on('error', console.error)
		.on('data', handleTranscript);

recorder
	.record({
		sampleRateHertz: sampleRateHertz,
		threshold: 0,
		verbose: false,
		recordProgram: 'sox', // Try also 'arecord' or 'sox'
		silence: '10.0',
	})
		.stream()
		.on('error', console.error)
		.pipe(recognizeStream);

console.log('🦻🦻');
