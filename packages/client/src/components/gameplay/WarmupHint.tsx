import { ph } from '@lingui/core/macro';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import type { RefObject } from 'react';

import HoverCard from '@oss-idle/shared/display/HoverCard';

import { warmupStage } from '../../gameplay/warmupStage';
import { selectedDef } from '../../rulesets/registry';

/** What to do now, on hover over the warm-up bar the canvas draws (its box placed over the bar
 *  each frame, makeWarmupPlacer). */
export default function WarmupHint({ bar, boxRef }: {
	bar: number,
	boxRef: RefObject<HTMLDivElement>,
}) {
	const { t } = useLingui();

	const def = selectedDef();
	const skills = def.physicalSkills.map(s => def.skillName(s)).join(', ');
	const now = {
		cold: t`Play harder maps to reach the sweet spot.`,
		warming: t`Play harder maps to reach the sweet spot.`,
		peak: t`Sweet spot: your physical skills are at their best.`,
		pushing: t`Past the sweet spot. Play easier maps to come back to it.`,
		fatigued: t`Fatigued: you earn less XP. Play easier maps to rest.`,
	}[warmupStage(bar)];

	return (
		<div className="play__warmup-hint" ref={boxRef}>
			<HoverCard card={
				<span className="play__warmup-tip">
					<span className="play__warmup-tip-now">{now}</span>
					<span>
						<Trans>
							Physically demanding maps ({ph({ skills })}) move the needle right, easier maps
							and time off move it left. Keep it in the middle.
						</Trans>
					</span>
				</span>
			}>
				<span className="play__warmup-hint-area" />
			</HoverCard>
		</div>
	);
}
