import SceneManager, { SCENE } from '../scenes/SceneManager';

const isAudio = (file: File) => /\.(mp3|ogg|wav)$/i.test(file.name);

// an audio file dropped on the menu or song select starts a map on it; the editor
// loads with it
window.addEventListener('drop', e => {
	const scene = SceneManager.current.get();
	if (scene !== SCENE.MENU && scene !== SCENE.SELECT) return;
	const audio = [...e.dataTransfer?.files ?? []].find(isAudio);
	if (audio) void import('./newMap').then(({ startMap }) => startMap(audio));
});
