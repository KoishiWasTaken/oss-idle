import { useLingui } from '@lingui/react/macro';
import {
	MAX_DIVISOR,
	omitsFirstBarLine,
	type TimingPoint,
} from '@oss-idle/shared/editor/chart';
import EditorField from './EditorField';
import '../components/options/controls/Checkbox.css';
import type EditorSession from './session';

const round = (n: number) => String(Math.round(n * 1000) / 1000);

type Props = { session: EditorSession, point: TimingPoint, active: boolean };

/** One BPM point: its time (click the arrow to go there), BPM, beats per bar, the beat snap
 *  its section is mapped in (empty for none) and whether its first bar line shows (osu!'s
 *  omit first bar line, the other way round). */
export default function EditorTimingPoint({ session, point, active }: Props) {
	const { t } = useLingui();
	const bpm = round(60000 / point.beatLength);
	const number = (value: string, use: (n: number) => void) => {
		const n = Number(value);
		if (Number.isFinite(n) && n > 0) use(n);
	};
	const update = (change: Partial<TimingPoint>) => session.updateTimingPoint(point, change);

	return (
		<div className={`editor__point ${active ? 'is-active' : ''}`}>
			<button
				className="editor__seek-to"
				aria-label={t`Go there`}
				onClick={() => session.seek(point.time)}
			>
				▸
			</button>
			<EditorField
				key={`time:${point.time}`}
				type="number"
				label={t`Time (ms)`}
				value={String(point.time)}
				onCommit={v => {
					// 0 or before the song is fine: osu! maps often start there
					const time = Number(v);
					if (v.trim() && Number.isFinite(time)) update({ time: Math.round(time) });
				}}
			/>
			<EditorField
				key={`bpm:${bpm}`}
				type="number"
				label={t`BPM`}
				value={bpm}
				onCommit={v => number(v, n => update({ beatLength: 60000 / n }))}
			/>
			<EditorField
				key={`meter:${point.meter}`}
				type="number"
				label={t`Beats per bar`}
				value={String(point.meter)}
				onCommit={v => number(v, meter => update({ meter: Math.round(meter) }))}
			/>
			<EditorField
				key={`snap:${point.snap}`}
				type="number"
				label={t`Beat snap`}
				value={point.snap ? String(point.snap) : ''}
				onCommit={v => {
					const snap = Math.round(Number(v));
					if (!v.trim()) session.setSectionSnap(point, undefined);
					else if (snap >= 1 && snap <= MAX_DIVISOR) session.setSectionSnap(point, snap);
				}}
			/>
			<button
				type="button"
				role="checkbox"
				className={`opt-checkbox editor__check ${omitsFirstBarLine(point) ? '' : 'is-on'}`}
				aria-label={t`Show the first bar line`}
				aria-checked={!omitsFirstBarLine(point)}
				onClick={() => session.setOmitFirstBarLine(point, !omitsFirstBarLine(point))}
			>
				<span className="opt-checkbox__box" aria-hidden>
					<span className="opt-checkbox__tick" />
				</span>
			</button>
			<button
				className="editor__remove"
				aria-label={t`Remove`}
				onClick={() => session.removeTimingPoint(point)}
			>
				×
			</button>
		</div>
	);
}
