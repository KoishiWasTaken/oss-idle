import { useLingui } from '@lingui/react/macro';
import type { Mod } from '@oss-idle/shared/mods';
import {
	MOD_LOOK,
	modName,
} from '@oss-idle/shared/display/mods';
import Glyph from '../multiplayer/Glyph';
import { rateShort } from '../mods/rateShort';

/** The mods a score was played with, in a row under its grade as on osu!'s ranking screen. */
export default function ResultMods({ rate, mods }: { rate: number, mods: Mod[] }) {
	const { t } = useLingui();
	if (rate === 1 && !mods.length) return null;
	const double = rate > 1;
	return (
		<div className="result__mods">
			{mods.map(mod => (
				<div
					key={mod} className="result__mod" style={{ background: MOD_LOOK[mod].tint }}
					aria-label={modName(mod)}
				>
					<Glyph name={MOD_LOOK[mod].glyph} className="result__mod-glyph" />
					<span className="result__mod-short">{mod}</span>
				</div>
			))}
			{rate !== 1 && (
				<div
					className="result__mod" data-side={double ? 'double' : 'half'}
					aria-label={double ? t`Double` : t`Half`}
				>
					<Glyph name={double ? 'clock' : 'hourglass'} className="result__mod-glyph" />
					<span className="result__mod-short">{rateShort(rate)}</span>
				</div>
			)}
		</div>
	);
}
