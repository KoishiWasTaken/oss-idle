import type { BpmGuess } from './bpmDetect';

/** The song's tempo guessed in a worker of its own, so the editor doesn't stop for it. */
export const detectSongBpm = (
	song: { pcm: Float32Array, rate: number },
): Promise<BpmGuess | undefined> => new Promise(resolve => {
	const worker = new Worker(new URL('./bpmWorker.ts', import.meta.url), { type: 'module' });
	worker.onmessage = (e: MessageEvent<BpmGuess | undefined>) => {
		resolve(e.data);
		worker.terminate();
	};
	worker.onerror = () => {
		resolve(undefined);
		worker.terminate();
	};
	const pcm = song.pcm.slice();
	worker.postMessage({
		pcm, rate: song.rate,
	}, [pcm.buffer]);
});
