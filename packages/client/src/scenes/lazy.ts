import { lazy } from 'react';

// the heavy scenes are chunks of their own: the intro shows without them
const loaders = {
	SongSelect: () => import('./SongSelect'),
	Gameplay: () => import('./Gameplay'),
	Result: () => import('./Result'),
	Lobby: () => import('./Lobby'),
	MatchSetup: () => import('./MatchSetup'),
	Screensaver: () => import('./Screensaver'),
	Editor: () => import('./Editor'),
};

export const SongSelect = lazy(loaders.SongSelect);
export const Gameplay = lazy(loaders.Gameplay);
export const Result = lazy(loaders.Result);
export const Lobby = lazy(loaders.Lobby);
export const MatchSetup = lazy(loaders.MatchSetup);
export const Screensaver = lazy(loaders.Screensaver);
export const Editor = lazy(loaders.Editor);
/** dev only, from song select's debug tools */
export const StrainDebug = lazy(() => import('./StrainDebug'));

/** Load the heavy scenes in the background: they come in while the intro plays. */
export const prefetchScenes = (): void => {
	for (const load of Object.values(loaders)) void load();
};
