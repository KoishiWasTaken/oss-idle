import { ph } from '@lingui/core/macro';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useState } from 'react';

import HoverCard from '@oss-idle/shared/display/HoverCard';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import { clock } from './clock';
import type EditorSession from './session';

/** A positive number typed in, or undefined. */
const positive = (value: string): number | undefined => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0 ? n : undefined;
};


/** SV over the selected notes' stretch: a linear ramp on the beat lines, one speed, or
 *  every speed scaled. */
export default function EditorScrollTools({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	const [start, setStart] = useState('1');
	const [end, setEnd] = useState('2');
	const [speed, setSpeed] = useState('1');
	const [factor, setFactor] = useState('1.5');
	const range = session.scrollRange;

	const field = (value: string, set: (v: string) => void, label: string) => (
		<input
			className="editor__field"
			type="number"
			step="any"
			value={value}
			aria-label={label}
			onChange={e => set(e.target.value)}
		/>
	);
	const linear = positive(start) !== undefined && positive(end) !== undefined;
	if (!range) {
		return (
			<span className="editor__hint editor__tools-hint">
				<Trans>Select notes for the ramp, set and scale tools.</Trans>
			</span>
		);
	}

	return (
		<div className="editor__stat editor__tools">
			<span className="ladder-sum__label">
				<Trans>Over the selection, {ph({ from: clock(range.from) })} to {ph({ to: clock(range.to) })}</Trans>
			</span>
			<div className="editor__tool">
				<span><Trans>Linear</Trans></span>
				<span className="editor__tool-fields">
					{field(start, setStart, t`From speed`)}→{field(end, setEnd, t`To speed`)}
				</span>
				<HoverCard card={<Trans>A point on every beat line of the current snap</Trans>}>
					<button
						className="editor__small"
						disabled={!linear}
						onClick={() => session.linearScroll(positive(start)!, positive(end)!)}
					>
						<Trans>Apply</Trans>
					</button>
				</HoverCard>
			</div>
			<div className="editor__tool">
				<span><Trans>Set to</Trans></span>
				<span className="editor__tool-fields">{field(speed, setSpeed, t`Speed for the stretch`)}</span>
				<button
					className="editor__small"
					disabled={positive(speed) === undefined}
					onClick={() => session.constantScroll(positive(speed)!)}
				>
					<Trans>Apply</Trans>
				</button>
			</div>
			<div className="editor__tool">
				<span><Trans>Scale by</Trans></span>
				<span className="editor__tool-fields">{field(factor, setFactor, t`Scale factor`)}</span>
				<button
					className="editor__small"
					disabled={positive(factor) === undefined}
					onClick={() => session.scaleScroll(positive(factor)!)}
				>
					<Trans>Apply</Trans>
				</button>
			</div>
		</div>
	);
}
