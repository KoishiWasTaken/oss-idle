import { Beatmap } from 'osu-classes';
import {
	useEffect,
	useRef,
	useState,
} from 'react';

import { type Grade } from '@oss-idle/shared/grade';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { OSU_MODE } from '@oss-idle/shared/rulesets/ids';
import { ManiaGame } from '@oss-idle/shared/rulesets/mania/maniaGame';
import { scrollSpeedToMs } from '@oss-idle/shared/rulesets/mania/scroll_speed';

import { music } from '../../audio/MusicPlayer';
import { SETTINGS } from '../../db/settings';
import GameplayRenderer from '../../gameplay/gameplayRenderer';
import { makeGradePlacer } from '../../gameplay/gradeBadge';
import { skinTestChart } from '../../gameplay/skinTestChart';
import BeatmapStore from '../../osu/beatmap/beatmap_store';
import type Skin from '../../osu/skin/Skin';
import { currentSkin } from '../../osu/skin/Skin';
import { loadPlayer } from '../../rulesets/registry';
import { sizeCanvas } from '../../sizeCanvas';

/**
 * A silent full-gameplay preview of the currently playing beatmap, synced to the
 * live music position (a chart of our own when nothing plays), drawn with the given skin so a player sees every
 * skinnable element - notes, keys, lighting, HP bar, judgements, combo, grade -
 * in motion. The current skin stands in while the given one loads. Reuses the gameplay GameplayRenderer and a
 * debug-level bot; no audio of its own, scoring submit, or server session.
 */
export default function GameplayPreview({ skin: shown }: { skin: Skin | undefined }) {
	const [beatmapInfo] = useSynced(music.beatmap);
	const [dim] = useSynced(SETTINGS.backgroundDim);
	const [current] = useSynced(currentSkin);
	const skin = shown ?? current;
	const [grade, setGrade] = useState<Grade>('X');

	const wrapRef = useRef<HTMLDivElement>(null);
	const bgRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gradeRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<GameplayRenderer | null>(null);
	const skinRef = useRef(skin);
	skinRef.current = skin;

	useEffect(() => {
		rendererRef.current?.setSkin(skin);
	}, [skin]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const ctx = canvas.getContext('2d')!;

		let raf = 0;
		let alive = true;
		let ro: ResizeObserver | undefined;
		let bgUrl: string | undefined;
		void (async () => {
			let beatmap: Beatmap;
			try {
				// nothing playing: a chart of our own, on a clock of its own
				beatmap = beatmapInfo ? await beatmapInfo.load() : skinTestChart(4);
			} catch {
				return;
			}
			if (!alive || beatmap.hitObjects.length === 0) return;
			// the test chart is 4K mania
			const player = await loadPlayer(
				beatmapInfo?.metadata.mode ?? OSU_MODE.mania, beatmapInfo?.metadata.keys ?? 4,
			);
			if (!alive || !player) return;

			// a debug-level bot plays the map so notes get hit and the HUD comes alive;
			// building the game runs its strain analysis, so bot.strainsAt feeds the gauges
			const bot = player.debugBot();
			const game = new ManiaGame(beatmap, bot, { noFail: true });
			const renderer = new GameplayRenderer(ctx, game, skinRef.current);
			rendererRef.current = renderer;
			const strain = {
				source: bot, gauges: player.strainGauges(),
			};

			if (beatmapInfo) void BeatmapStore.getBeatmapBackground(beatmap).then(url => {
				if (!alive || !url) return;
				bgUrl = url;
				if (bgRef.current) bgRef.current.style.backgroundImage = `url("${url}")`;
			});

			const scrollMs = scrollSpeedToMs(SETTINGS.scrollspeed.get());
			let w = 0;
			let h = 0;
			const resize = () => {
				w = wrap.clientWidth;
				h = wrap.clientHeight;
				sizeCanvas(canvas, ctx, w, h, false);
			};
			resize();
			ro = new ResizeObserver(resize);
			ro.observe(wrap);

			const placeGrade = makeGradePlacer();
			const start = performance.now();
			const loop = game.songEndMs + 1000;
			const draw = () => {
				// follow the live music position so the notes stay synced to the track
				// (it loops / advances on its own; a backward jump rewinds the sim)
				const now = beatmapInfo ? Math.max(0, music.time()) : (performance.now() - start) % loop;
				if (now < game.now()) game.seek(now);
				else game.update(now);
				const vp = {
					w,
					h,
					scrollMs,
				};
				renderer.clear(vp);
				const g = renderer.draw(now, vp, {
					strain,
					onGrade: setGrade,
				});
				placeGrade(gradeRef.current, g);
				raf = requestAnimationFrame(draw);
			};
			raf = requestAnimationFrame(draw);
		})();

		return () => {
			alive = false;
			cancelAnimationFrame(raf);
			ro?.disconnect();
			rendererRef.current = null;
			if (bgUrl) URL.revokeObjectURL(bgUrl);
		};
	}, [beatmapInfo]);

	return (
		<div className='skin-preview' ref={wrapRef}>
			<div ref={bgRef} className='skin-preview__bg' />
			<div className='skin-preview__dim' style={{ opacity: Math.max(0, Math.min(1, dim)) }} />
			<canvas ref={canvasRef} className='skin-preview__canvas' />
			<div ref={gradeRef} className='skin-preview__grade'>{skin.grade(grade)}</div>
		</div>
	);
}
