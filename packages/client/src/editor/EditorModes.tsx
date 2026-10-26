import { useLingui } from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import type {
	default as EditorSession,
	EditorTool,
} from './session';

/** The tools a left click on the field works with, big enough to switch by mouse (Tab
 *  cycles them). Each icon draws what it makes: a cursor, a note, a long note. */
export default function EditorModes({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	const tools: [EditorTool, string, React.ReactNode][] = [
		['select', t`Select`, <path d='M7 3l11 9-5 1 3 6-2 1-3-6-4 4z' />],
		['note', t`Note`, <rect x='3' y='10' width='18' height='5' rx='2' />],
		['hold', t`Note + LN`, <>
			<rect x='6' y='3' width='12' height='17' rx='1' opacity='0.45' />
			<rect x='3' y='16' width='18' height='5' rx='2' />
		</>],
	];
	return (
		<div className='editor__modes'>
			{tools.map(([id, label, icon]) => (
				<button
					key={id}
					className={id === session.tool ? 'is-active' : ''}
					onClick={() => session.setTool(id)}
				>
					<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden>{icon}</svg>
					{label}
				</button>
			))}
		</div>
	);
}
