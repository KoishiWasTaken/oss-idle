import { Beatmap } from 'osu-classes';

import CharacterBot, {
	type NoteStrain,
	Strains,
} from '@oss-idle/shared/rulesets/mania/4k/bots/character';
import Accuracy from '@oss-idle/shared/rulesets/mania/4k/skills/accuracy';
import Concentration from '@oss-idle/shared/rulesets/mania/4k/skills/concentration';
import Consistency from '@oss-idle/shared/rulesets/mania/4k/skills/consistency';
import Coordination from '@oss-idle/shared/rulesets/mania/4k/skills/coordination';
import { makeOrderedSkills } from '@oss-idle/shared/rulesets/mania/4k/skills/factory';
import JackSpeed from '@oss-idle/shared/rulesets/mania/4k/skills/jackspeed';
import Memory from '@oss-idle/shared/rulesets/mania/4k/skills/memory';
import Reading from '@oss-idle/shared/rulesets/mania/4k/skills/reading';
import Release from '@oss-idle/shared/rulesets/mania/4k/skills/release';
import Speed from '@oss-idle/shared/rulesets/mania/4k/skills/speed';
import SpeedJam from '@oss-idle/shared/rulesets/mania/4k/skills/speedjam';
import Stamina from '@oss-idle/shared/rulesets/mania/4k/skills/stamina';
import { JUDGEMENT } from '@oss-idle/shared/rulesets/mania/judgement';
import {
	type HitRecord,
	ManiaGame,
} from '@oss-idle/shared/rulesets/mania/maniaGame';
import type RuntimeNote from '@oss-idle/shared/rulesets/mania/runtimeNote';
import {
	HitWindows,
	judge,
	maniaWindows,
	ScoreState,
} from '@oss-idle/shared/rulesets/mania/scoring';

import type Character from '../../../db/schema/character';
import { DEBUG_BOT_LEVEL } from './player';

/* keep the skill imports loaded for ad-hoc debugging - reference them so tsc
 * (noUnusedLocals) doesn't strip them while they're commented out of use. */
void [
	Reading, 
	Speed, 
	Stamina, 
	JackSpeed, 
	Concentration, 
	Consistency,
	Accuracy, 
	Release, 
	Coordination, 
	Memory, 
	SpeedJam,
];



export const DEBUG_BOT_TIMES_PLAYED = 6;

export interface StrainSeries {
	name: string
	hits: HitRecord[]
	score: ScoreState
	/** skill level, if this series corresponds to a single skill */
	level?: number
	/** total time spent running this skill's `analyze` across the map, in ms */
	computeMs?: number
	/** song time (ms) at which this series' HP first hit 0, if it failed */
	failMs?: number
	/** an extra 0..1 curve drawn over the graph (consistency: the pressure its
	 *  choke roll saw on each note) */
	overlay?: { time: number, value: number }[]
	/** XP this skill would gain from the combined play (combined: the total) */
	xp?: number
}

/** Song time at which a play failed (HP hit 0), or undefined if it survived. */
function failMsFromScore(
	score: ScoreState,
	hits: HitRecord[],
): number | undefined {
	return score.failedIndex > 0 ? hits[score.failedIndex - 1]?.time : undefined;
}

function scoreFromHits(hp: number, od: number, hits: HitRecord[]): ScoreState {
	const score = new ScoreState(hp, od, hits.length);
	for (const h of hits) score.add(h.judgement);
	return score;
}

export interface StrainAnalysis {
	/** one series per skill, plus a final "combined" series (what the bot plays) */
	series: StrainSeries[]
	windows: HitWindows
	songEndMs: number
}

/** Record one skill's strain for one note into its series: the consistency
 *  pressure overlay, and the press (or release, for held notes) hit record. */
function recordStrain(
	series: Map<string, StrainSeries>,
	skill: { name: string },
	note: RuntimeNote,
	strain: [NoteStrain, number, number],
	windows: HitWindows,
): void {
	if (skill.name === 'consistency' && strain[0].pressure !== undefined) {
		const s = series.get(skill.name)!;
		(s.overlay ??= []).push({
			time: note.time, value: strain[0].pressure, 
		});
	}

	if (skill.name !== 'release') {
		const j = judge(Math.abs(strain[1]), windows);
		// match the combined graph: a miss has no meaningful offset
		series.get(skill.name)?.hits.push({ 
			time: note.time, 
			offset: j === JUDGEMENT.MISS ? null : strain[1], 
			judgement: j, 
		});
	}
	if (skill.name === 'release' && note.hold) {
		const j = judge(Math.abs(strain[2]), windows);
		series.get(skill.name)?.hits.push({ 
			time: note.endTime, 
			offset: j === JUDGEMENT.MISS ? null : strain[2], 
			judgement: j, 
		});
	}
}

export function analyzeBeatmap(
	character: Character,
	beatmap: Beatmap,
	scrollMs = 600,
): StrainAnalysis {
	// const debugSkills = null;
	const memory = new Memory(0);
	memory.timesPlayed.set(DEBUG_BOT_TIMES_PLAYED);
	const debugSkills = [
		new Reading(11),
		new Speed(10),
		new Stamina(17),
		new JackSpeed(8),
		new Concentration(14),
		new Consistency(17),
		new Accuracy(25),
		new Release(10),
		new Coordination(9),
		memory,
		new SpeedJam(4),
	];
	const skills = debugSkills 
		?? makeOrderedSkills(DEBUG_BOT_LEVEL) 
			?? character.skills
	;
	const bot = new CharacterBot(skills);
	const game = new ManiaGame(beatmap, bot, { scrollMs });

	const series = new Map<string, StrainSeries>();
	for (const skill of Object.values(skills)) {
		series.set(skill.name, { 
			name: skill.name, 
			hits: [], 
			score: scoreFromHits(beatmap.difficulty.
				drainRate,
			beatmap.difficulty.overallDifficulty, []), 
		});
	}

	const windows = maniaWindows(beatmap.difficulty.overallDifficulty);
	// `noteStrains` is private; its type is elided in the shared package's .d.ts,
	// so re-assert the shape for this debug view.
	const noteStrains = bot['noteStrains'] as Map<string, Strains>;

	for (const [, [note, strains]] of noteStrains) {
		for (const skill of Object.values(skills)) {
			const strain = strains.find(s => s[0].skill === skill.name);
			if (strain) recordStrain(series, skill, note, strain, windows);
		}
	}

	for (const skill of Object.values(skills)) {
		const s = series.get(skill.name)!;
		s.score = scoreFromHits(
			beatmap.difficulty.drainRate, 
			beatmap.difficulty.overallDifficulty, 
			s.hits,
		);
		s.level = skill.level.get();
		s.failMs = failMsFromScore(s.score, s.hits);
	}

	game.update(game.songEndMs + 2000);

	const combinedScore = scoreFromHits(
		beatmap.difficulty.drainRate, 
		beatmap.difficulty.overallDifficulty, 
		game.hits,
	);

	// XP breakdown: what each skill would earn from this play's combined score
	const xp = bot.getSkillsXP(beatmap.totalLength, combinedScore);
	for (const skill of Object.values(skills)) {
		series.get(skill.name)!.xp = xp[skill.name];
	}

	series.set('combined', {
		name: 'combined',
		hits: game.hits,
		score: combinedScore,
		failMs: failMsFromScore(combinedScore, game.hits),
		xp: Object.values(xp).reduce((sum, gain) => sum + gain, 0),
	});

	return { 
		series: Array.from(series.values()), 
		windows, 
		songEndMs: game.songEndMs, 
	};
}
