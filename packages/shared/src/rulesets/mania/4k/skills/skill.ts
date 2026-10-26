import SkillState from '../../../skillState.js';
import type { BotContext } from '../../bot.js';
import type RuntimeNote from '../../runtimeNote.js';
import type {
	SkillStrain,
	Strain,
} from '../bots/character.js';
import type { SkillName } from '../skills.js';
import { mapLevel } from './levelCurve.js';

/** A 4K skill: its progression, and how it strains on each note. */
export default abstract class Skill extends SkillState<SkillName> {

	abstract analyze(
		note: RuntimeNote, 
		context: BotContext, 
		mapStrain: Strain, 
		colStrain: Strain,
		prev?: RuntimeNote, 
		next?: RuntimeNote
	): SkillStrain;

	/** Subscribe to the mapped level the strain curves read. Skills use this
	 *  instead of level.sync so prestige bonuses and the xp banked inside the
	 *  current level reach their rates - a play gets better as it earns, not
	 *  only when the level flips. */
	protected syncSkillLevel(apply: (level: number) => void): void {
		const run = () => apply(mapLevel(this.effectiveLevel()));
		void this.level.sync(run);
		void this.xp.sync(run);
		void this.prestige.sync(run);
	}
}
