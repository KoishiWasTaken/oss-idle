import { WsolaStream } from './timeStretch';

/**
 * The track at another speed, its pitch kept, stretched as it plays (WSOLA, a piece
 * ahead of what is heard) rather than all at once first: a speed change or a seek is
 * heard at once, however long the song. The page sends the track once, then where to
 * play from, when and how fast.
 */

// the audio worklet scope's own globals
declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
	readonly port: MessagePort;
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void;

export type LiveStretchMessage =
	| { type: 'load', channels: Float32Array[] }
	| { type: 'play', at: number, when: number, rate: number }
	| { type: 'stop' }
	| { type: 'unload' };

class LiveStretch extends AudioWorkletProcessor {

	private stream?: WsolaStream;
	/** the piece being played out, per channel, and how far into it */
	private piece: Float32Array[] = [];
	private played = 0;
	private filled = 0;
	private playing = false;
	/** context time the next play is heard from */
	private when = 0;

	constructor() {
		super();
		this.port.onmessage = (e: MessageEvent<LiveStretchMessage>) => this.receive(e.data);
	}

	private receive(message: LiveStretchMessage) {
		if (message.type === 'load') {
			this.stream = new WsolaStream(message.channels, sampleRate);
			this.piece = message.channels.map(() => new Float32Array(this.stream!.hop));
			this.playing = false;
		} else if (message.type === 'play' && this.stream) {
			this.stream.start(Math.max(0, Math.round(message.at)), message.rate);
			this.played = this.filled = 0;
			this.when = message.when;
			this.playing = true;
		} else if (message.type === 'stop') {
			this.playing = false;
		} else if (message.type === 'unload') {
			this.playing = false;
			this.stream = undefined;
			this.piece = [];
		}
	}

	public process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
		const out = outputs[0];
		const frames = out[0]?.length ?? 0;
		if (!this.playing || !this.stream) return true;
		// silent until the moment it was asked to start
		let frame = Math.min(frames, Math.max(0, Math.round((this.when - currentTime) * sampleRate)));
		while (frame < frames) {
			if (this.played === this.filled) {
				if (!this.stream.next(this.piece, 0)) {
					this.playing = false;
					break;
				}
				this.played = 0;
				this.filled = this.stream.hop;
			}
			const take = Math.min(frames - frame, this.filled - this.played);
			for (let c = 0; c < out.length; c++) {
				const piece = this.piece[c] ?? this.piece[0];
				const channel = out[c];
				for (let i = 0; i < take; i++) channel[frame + i] = piece[this.played + i];
			}
			this.played += take;
			frame += take;
		}
		return true;
	}

}

registerProcessor('live-stretch', LiveStretch);
