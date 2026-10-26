import { useLingui } from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

const MAX_LENGTH = 64;

/** The result a map's votes are for; admins write it in place. */
export default function LevelMapTarget({ target, admin, onChange }: {
	target: string,
	admin: boolean,
	onChange: (target: string) => void,
}) {
	const { t } = useLingui();
	const [text, setText] = useState(target);
	useEffect(() => setText(target), [target]);

	if (!admin) return target ? <span className='level-map__target'>{target}</span> : undefined;

	return (<input
		className='level-map__target level-map__target--edit'
		value={text}
		maxLength={MAX_LENGTH}
		placeholder={t`e.g. for a 96-97% clear`}
		aria-label={t`What the votes are for`}
		onChange={e => setText(e.target.value)}
		onBlur={() => { if (text.trim() !== target) onChange(text.trim()); }}
		onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
	/>);
}
