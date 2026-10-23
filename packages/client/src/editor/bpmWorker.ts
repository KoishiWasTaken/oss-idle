import { detectBpm } from './bpmDetect';

/** Detects a song's tempo off the page: the samples come in, the guess goes back. */
self.onmessage = (e: MessageEvent<{ pcm: Float32Array, rate: number }>) => {
	self.postMessage(detectBpm(e.data.pcm, e.data.rate));
};
