import {
	parseMods,
	type Mod,
} from '@oss-idle/shared/mods';
import { MOD_LOOK } from '@oss-idle/shared/display/mods';
import RateBadge from './RateBadge';

/** A score's mods, then its rate. Nothing for a plain play. Raw score rows carry
 *  their mods as stored ("HR,SD"). */
export default function ScoreMods({ mods, rate }: { mods: Mod[] | string, rate: number | string }) {
	return <>
		{(typeof mods === 'string' ? parseMods(mods) : mods).map(mod => (
			<span key={mod} className='rate-badge' style={{ background: MOD_LOOK[mod].tint }}>{mod}</span>
		))}
		<RateBadge rate={rate} />
	</>;
}
