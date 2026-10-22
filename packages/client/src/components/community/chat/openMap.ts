import {
	isCommunityOpen,
	isWebOpen,
	openPage,
	webUrl,
} from '../../../globals';
import { music } from '../../../audio/MusicPlayer';
import { isListed } from '../../../osu/beatmap/beatmap_api';
import { findCard } from '../../../osu/beatmap/findCard';
import Auth from '../../../online/auth';
import { directLink } from '../../direct/directState';
import BeatmapAPI from '../../../osu/beatmap/beatmap_api';
import SceneManager, { SCENE } from '../../../scenes/SceneManager';
import { queueSelection } from '../../songselect/selection';
import type { MapRef } from './links';

/** A map clicked in chat: oss!direct's panel for a supporter, like osu!. Otherwise song
 *  select moves to it, the main menu plays it, anywhere else nothing happens; a map the
 *  game doesn't list opens its page on the site. */
export async function openChatMap(map: MapRef): Promise<void> {
	if (Auth.user.get()?.supporter
		&& (await BeatmapAPI.getManifest()).beatmaps.some(s => s.id === map.setId)) {
		void isCommunityOpen.set(false);
		void directLink.set(map.setId);
		return;
	}
	const scene = SceneManager.current.get();
	if (scene !== SCENE.SELECT && scene !== SCENE.MENU) return;
	const card = await findCard(map.beatmapId, map.setId);
	const beatmap = card?.beatmap;
	if (!beatmap || (!card.set.metadata.runtime && !isListed(card.set.metadata))) {
		void webUrl.set(`maps/${map.setId}?diff=${map.beatmapId}`);
		void isWebOpen.set(true);
		return;
	}
	void isCommunityOpen.set(false);
	if (scene === SCENE.MENU) {
		await music.beatmap.set(beatmap);
		await music.play(0);
	} else if (openPage.get()?.page === 'queue') {
		await queueSelection.set(beatmap);
	} else {
		await music.beatmap.set(beatmap);
	}
}
