import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useState } from 'react';

import {
	type MedalDef,
	medalLook,
} from '@oss-idle/shared/achievements/catalogue';
import useAsync from '@oss-idle/shared/hooks/useAsync';

import {
	getCharacter,
	getCharacterMedals,
} from '../../api/characters';
import { setTitle } from '../../api/users';
import MedalIcon from '../../components/character/MedalIcon';
import ShowMoreLink from '../../components/ShowMoreLink';
import { medalName } from '../../rulesets';
import { allMedals } from '../../rulesets';

/** Pick which held medal's name shows under the character's name. */
export default function TitleSettings({ id }: { id: string }) {
	const { t } = useLingui();
	const loaded = useAsync(() => Promise.all([getCharacter(id), getCharacterMedals(id)]), [id]);
	const [chosen, setChosen] = useState<string>();
	// folded: only the title worn and taking it off
	const [all, setAll] = useState(false);
	if (!loaded) return <Trans>Loading…</Trans>;

	const [character, medals] = loaded;
	const held = new Set(medals.held.map(m => m.id));
	const current = chosen ?? character.title ?? '';
	const choose = (next: string) => {
		setChosen(next);
		setTitle(next || undefined).catch(() => setChosen(current));
	};
	const options: { value: string; label: string; medal?: MedalDef }[] = [
		{
			value: '', label: t`no title`,
		},
		...allMedals().filter(m => held.has(m.id)).map(m => ({
			value: m.id, label: medalName(m.id), medal: m,
		})),
	];
	const shown = all ? options : options.filter(o => o.value === '' || o.value === current);

	return <>
		<div className='settings__hint'>
			<Trans>Wear the name of a medal you hold under your name on your profile.</Trans>
		</div>
		<div className='settings__radios'>
			{shown.map(o => <label key={o.value} className='settings__radio'>
				<input
					type='radio'
					name='title'
					checked={current === o.value}
					onChange={() => choose(o.value)}
				/>
				{o.medal && <span className='settings__medal'><MedalIcon look={medalLook(o.medal)} /></span>}
				{o.label}
			</label>)}
		</div>
		<ShowMoreLink
			hasMore={shown.length < options.length} loading={false}
			onClick={() => setAll(true)}
		/>
	</>;
}
