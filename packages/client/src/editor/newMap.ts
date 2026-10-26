import {
	ph,
	t,
} from '@lingui/core/macro';

import Entities from '../entity/entities';
import { message } from '../globals';
import Auth from '../online/auth';
import SceneManager, { SCENE } from '../scenes/SceneManager';
import { createSet } from './save';

export const AUDIO_TYPES = 'audio/*,.mp3,.ogg,.wav';

/** Start a map on an audio file, straight into the editor, which asks for its metadata. */
export const startMap = async (audio: File) => {
	try {
		const beatmap = await createSet(audio, {
			creator: Auth.user.get()?.username ?? Entities.character.get().name,
			version: t`New difficulty`,
			keys: 4,
		});
		SceneManager.set(SCENE.EDITOR, beatmap, undefined, true);
	} catch (e) {
		console.error('[editor] new map failed', e);
		message.set(t`Could not start a map on ${ph({ name: audio.name })}`);
	}
};
