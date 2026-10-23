import Synced from '@oss-idle/shared/helpers/synced';

/** The one set preview a panel plays on the page, and how far along it is. */
export type Preview = { setId: number, state: 'loading' | 'playing', progress: number };

export const preview = new Synced<Preview | undefined>(undefined);

let audio: HTMLAudioElement | undefined;

const stop = () => {
	audio?.pause();
	audio = undefined;
	void preview.set(undefined);
};

/** Play a set's preview, or stop it when it is the one playing; any other one stops. */
export const togglePreview = (setId: number, src: string) => {
	const playing = preview.get()?.setId === setId;
	stop();
	if (playing) return;
	const track = new Audio(src);
	audio = track;
	void preview.set({
		setId, state: 'loading', progress: 0, 
	});
	const mine = (then: () => void) => () => { if (audio === track) then(); };
	track.ontimeupdate = mine(() => void preview.set({
		setId, state: 'playing', progress: track.currentTime / (track.duration || 1), 
	}));
	track.onended = track.onerror = mine(stop);
	track.play().catch(mine(stop));
};

/** Stop the set's preview if it is the one playing (its panel went away). */
export const stopPreview = (setId: number) => {
	if (preview.get()?.setId === setId) stop();
};
