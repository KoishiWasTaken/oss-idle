import {
	useEffect,
	useState,
} from 'react';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import HoverCard from '@oss-idle/shared/display/HoverCard';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { skillName } from '@oss-idle/shared/display/skills';
import { PHYSICAL_SKILLS } from '@oss-idle/shared/skills';
import { scoreboardEdge } from '../multiplayer/scoreboardEdge';
import { warmupGaugeBox } from '../../gameplay/render/hud';
import { warmupStage } from '../../gameplay/warmupStage';

const windowSize = () => ({
	w: innerWidth,
	h: innerHeight,
});

/** What to do now, on hover over the warm-up bar the canvas draws. */
export default function WarmupHint({ bar }: { bar: number }) {
	const { t } = useLingui();
	const [edge] = useSynced(scoreboardEdge);
	const [vp, setVp] = useState(windowSize);

	useEffect(() => {
		const resize = () => setVp(windowSize());
		addEventListener('resize', resize);
		return () => removeEventListener('resize', resize);
	}, []);

	const skills = PHYSICAL_SKILLS.map(skillName).join(', ');
	const now = {
		cold: t`Play harder maps to reach the sweet spot.`,
		warming: t`Play harder maps to reach the sweet spot.`,
		peak: t`Sweet spot: your physical skills are at their best.`,
		pushing: t`Past the sweet spot. Play easier maps to come back to it.`,
		fatigued: t`Fatigued: you earn less XP. Play easier maps to rest.`,
	}[warmupStage(bar)];

	return (
		<div className="play__warmup-hint" style={warmupGaugeBox(vp, edge ? edge + 16 : undefined)}>
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
