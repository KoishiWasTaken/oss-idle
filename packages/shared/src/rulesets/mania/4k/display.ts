import {
	__,
	defineMessages,
} from '../../../i18n/translate.js';
import { EZ_XP } from '../../../mods.js';
import type { FixedLength } from '../../../types/fixed_length.js';
import { gearLabel } from '../gear.js';
import { HR_ACCURACY_XP } from './modXp.js';
import {
	SKILL,
	type SkillName,
} from './skills.js';

// Display names live here, deliberately apart from skills.ts - that file owns
// the enum keys the sim/scoring branch on (logic), this owns how they read to a
// player (display). `defineMessages` makes the extractor collect each literal
// into the shared catalog; `__` then resolves by key at render time.
const SKILL_NAMES = defineMessages({
	accuracy: 'Accuracy',
	speed: 'Speed',
	stamina: 'Stamina',
	coordination: 'Coordination',
	consistency: 'Consistency',
	jackspeed: 'Jack Speed',
	reading: 'Reading',
	memory: 'Memory',
	concentration: 'Concentration',
	release: 'Release',
	speedjam: 'Speed Jam',
	overall: 'Overall',
} satisfies Record<SkillName & 'overall', string>);

/** The player-facing, localized name of a skill. */
export function skillName(skill: SkillName | 'overall'): string {
	return __(SKILL_NAMES[skill]);
}

/** What a skill does in a play. */
const SKILL_DESCRIPTIONS = defineMessages({
	accuracy: 'How accurately you hit the notes as a baseline',
	speed: 'Determines how many notes you\'re comfortable hitting in short periods of time',
	stamina: 'How long you can keep up with patterns that are too dense for you',
	jackspeed: 'Raw individual finger speed',
	coordination: 'How well you handle other patterns while holding long notes',
	release: 'How accurate and stable you are when timing releases',
	reading: 'How well you are able to decipher complex patterns on screen without mashing',
	consistency: 'Determines how often you will get random chokes during plays',
	concentration: 'Determines whether you will start drifting away during longer plays',
	speedjam: 'How comfortable you generally are during SV sections',
	memory: 'Determines how fast and how well you are able to learn SV maps',
} satisfies Record<SkillName, string>);

/** The player-facing, localized description of what a skill does. */
export function skillDescription(skill: SkillName): string {
	return __(SKILL_DESCRIPTIONS[skill]);
}

/** What a skill's upgrade line is about - the story behind its gear list. */
const UPGRADE_DESCRIPTIONS = defineMessages({
	accuracy: 'Upgrade your keyboard to increase your synergy',
	speed: 'Get accustomed to higher scroll speeds to perform better',
	stamina: 'Build a better warmup routine to endure long maps',
	jackspeed: 'Tune drivers and firmware for faster repeated inputs',
	coordination: 'Try different layouts to increase finger independance',
	release: 'Find the perfect LN skin',
	reading: 'Upgrade your monitor to see the notes more clearly',
	consistency: 'Upgrade your chair to play more comfortably',
	concentration: 'Better audio and less noise to stay locked in',
	speedjam: 'Sharpen your note visuals to survive dense jams',
	memory: 'Change your way of learning SV maps',
} satisfies Record<SkillName, string>);

/** The player-facing, localized description of a skill's upgrade line. */
export function upgradeDescription(skill: SkillName): string {
	return __(UPGRADE_DESCRIPTIONS[skill]);
}

/** Each skill's gear, by upgrade level: names translate by key, numbers fill a template. */
export const UPGRADE = defineMessages({
	[SKILL.accuracy]: [
		'Dell XPS chiclet keyboard',
		'Lenovo IdeaPad ultrabook chiclet keyboard',
		'Unbranded membrane keyboard',
		'Logitech K120',
		'Cooler Master MS110',
		'Corsair K60',
		'Ducky One 2 Mini',
		'Glorious GMMK Pro',
		'Steelseries Apex Pro',
		'IRON165',
		'Norbaforce Mark IV',
	],
	[SKILL.speed]: [
		16,
		18,
		20,
		22,
		24,
		26,
		28,
		30,
		32,
		34,
		36,
	],
	[SKILL.stamina]: [
		'No warmup',
		'Thinks about warmup',
		'Warmup on easy maps',
		'Warmup on normal maps',
		'Warmup on hard maps',
		'Warmup on stamina packs',
		'1 hour pre-session warmup',
		'30 minutes muscle strength warmup',
		'2 hours gym session',
		'Gym, stretch session + meditation',
		'Mid-play stretching + meditation',
	],
	[SKILL.jackspeed]: [
		'Synaptics drivers',
		'60hz GMMK firmware',
		'Outdated stock Windows drivers',
		'Latest stock Windows drivers',
		'Stock Logitech G Hub',
		'Optimized MasterPlus+',
		'Low latency Corsair iCUE',
		'Embedded keyboard firmware',
		'Steelseries GG embedded profile',
		'Modded rapid trigger firmware',
		'Modded actuation prediction firmware',
	],
	[SKILL.coordination]: [
		'Controller',
		'DFJK',
		'SDKL',
		'ASL:',
		'AS:"',
		'QWOP',
		'QWP{',
		'QW{}',
		'AS45',
		'AS56',
		'←↓↑→',
	],
	[SKILL.release]: [
		'Default skin LNs',
		'Arrow skin LNs',
		'Circle skin LNs',
		'Bar skin LNs',
		'No tail LNs',
		'Fade-out tail LNs',
		'Light percy LNs',
		'Cut percy LNs',
		'Cut percy with LN end indicator',
		'Blank LN body with bar LN tail',
		'BottomCentered Anchored LN tails',
	],
	[SKILL.reading]: [
		30,
		50,
		60,
		75,
		100,
		120,
		144,
		165,
		240,
		360,
		540,
	],
	[SKILL.consistency]: [
		'Stool',
		'Basic plastic chair',
		'Metal folding chair',
		'Wooden chair',
		'Amazon basics Puresoft office chair',
		'CENTERHALV Ikea mesh office chair',
		'Hbada E3 Pro',
		'AndaSeat Kaiser 3',
		'DXRacer Drifting',
		'Secretlab TITAN Evo',
		'DOF Reality H6R',
	],
	[SKILL.concentration]: [
		'Sizzling speakers',
		'Used earbuds',
		'AirPods',
		'Yealink Phone Headset',
		'Logitech H390',
		'Razer BlackShark V3',
		'Voyager Focus 2',
		'Steelseries Arctis Nova 5',
		'Sony WH-1000XM4',
		'Sennheiser Momentum 4',
		'Bose QuietComfort Ultra',
	],
	[SKILL.speedjam]: [
		'Default skin notes',
		'Diamond skin notes',
		'Arrow skin notes',
		'Circle skin notes',
		'Bar skin notes',
		'Per-map scroll speed setting',
		'Music anticipation',
		'Note snap coloring',
		'Audio focused accuracy',
		'Dynamic sight focus',
		'Cap',
	],
	[SKILL.memory]: [
		'Vibe playing',
		'Passive learning',
		'Bruteforce learning',
		'Map editor studying',
		'Split map sections training',
		'Post-it notes',
		'Post-it pattern drawings',
		'Re-mapping to get mapper\'s advantage',
		'Memorizing the whole map',
		'Mental SV palace',
		'Dualscreen',
	],
} satisfies Record<SkillName, FixedLength<(string | number), 11>>);

/** Templates dressing the numeric upgrade entries: what the number *is*. */
const UPGRADE_VALUES = defineMessages({
	reading: '{value}hz Monitor',
	speed: '{value} Scroll Speed',
} satisfies Partial<Record<SkillName, string>>);

/**
 * The player-facing, localized label for a skill's upgrade at `level` (see
 * {@link gearLabel}): numeric ones (scroll speed, monitor hz) fill their skill's template.
 */
export function upgradeLabel(skill: SkillName, level: number): string {
	const template = (UPGRADE_VALUES as Partial<Record<SkillName, string>>)[skill];
	return gearLabel(UPGRADE[skill], template, level);
}

const PRESTIGE_NOTES: Partial<Record<SkillName, string>> =
	defineMessages({ memory: 'Resets every learned map' });

/** What prestiging a skill costs beyond its levels, when it costs more. */
export function prestigeNote(skill: SkillName): string | undefined {
	const note = PRESTIGE_NOTES[skill];
	return note && __(note);
}

/** The note under the skills list: what else moves a play's xp. */
export function skillsNote(): string {
	return __(
		'On top of these, each play\'s XP changes depending on mods (EZ x{ez} on every skill, HR x{hr} on Accuracy) and drops when you replay the same map many times in a day due to mindblock (except Speed, Stamina, Jack Speed and Memory).',
		undefined,
		{
			ez: EZ_XP, hr: HR_ACCURACY_XP,
		},
	);
}
