import { useLingui } from '@lingui/react/macro';
import {
	multiplierOf,
	scrollBeatLength,
	type TimingPoint,
} from '@oss-idle/shared/editor/chart';
import EditorField from './EditorField';
import type EditorSession from './session';

type Props = { session: EditorSession, point: TimingPoint, active: boolean };

const round = (n: number) => String(Math.round(n * 1000) / 1000);

/** One SV point: its time (click the arrow to go there) and multiplier. */
export default function EditorScrollPoint({ session, point, active }: Props) {
	const { t } = useLingui();
	const multiplier = round(multiplierOf(point));
	const positive = (value: string, use: (n: number) => void) => {
		const n = Number(value);
		if (Number.isFinite(n) && n > 0) use(n);
	};
	const update = (change: Partial<TimingPoint>) => session.updateScrollPoint(point, change);

	return (
		<div className={`editor__point editor__point--scroll ${active ? 'is-active' : ''}`}>
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
				onCommit={v => positive(v, time => update({ time: Math.round(time) }))}
			/>
			<EditorField
				key={`speed:${multiplier}`}
				type="number"
				label={t`Speed`}
				value={multiplier}
				onCommit={v => positive(v, n => update({ beatLength: scrollBeatLength(n) }))}
			/>
			<button
				className="editor__remove"
				aria-label={t`Remove`}
				onClick={() => session.removeScrollPoint(point)}
			>
				×
			</button>
		</div>
	);
}
