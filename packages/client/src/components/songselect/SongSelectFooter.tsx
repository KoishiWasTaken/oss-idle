import { Trans } from '@lingui/react/macro';
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { createPortal } from 'react-dom';

import useSynced from '@oss-idle/shared/hooks/useSynced';
import { playLabel } from '@oss-idle/shared/mods';
import {
	MODE_GLYPH,
	variantName,
} from '@oss-idle/shared/rulesets/display';
import {
	type RulesetId,
	RULESETS,
} from '@oss-idle/shared/rulesets/ids';

import { selectedMods } from '../../gameplay/playMods';
import {
	selectedRate,
	stepRate,
} from '../../gameplay/playRate';
import { ENABLED_RULESETS } from '../../rulesets/enabled';
import { selectedRuleset } from '../../rulesets/registry';
import ModSelect from '../mods/ModSelect';
import { modSelectOpen } from '../mods/modSelectOpen';
import Glyph from '../multiplayer/Glyph';
import ModeSelect from './ModeSelect';

/** The variant the Mode button shows: only where the mode has several. */
const shownVariant = (id: RulesetId) =>
	ENABLED_RULESETS.filter(other => RULESETS[other].mode === RULESETS[id].mode).length > 1
		? variantName(id)
		: undefined;

const RATE_KEYS: Record<string, 1 | -1> = {
	Minus: -1, Equal: 1,
};

/** osu!'s song select buttons next to Back: Mode (with a second ruleset), Mods (F1),
 *  Random (F2), Beatmap Options (F3). */
export default function SongSelectFooter({ onRandom, onOptions }: {
	onRandom: () => void,
	onOptions: () => void,
}) {
	const [rate] = useSynced(selectedRate);
	const [mods] = useSynced(selectedMods);
	const [ruleset] = useSynced(selectedRuleset);
	const active = playLabel(mods, rate);
	const variant = shownVariant(ruleset);
	const [modsOpen] = useSynced(modSelectOpen);
	const onMods = useCallback(() => void modSelectOpen.set(!modSelectOpen.get()), []);
	useEffect(() => () => void modSelectOpen.set(false), []);
	const [modeAnchor, setModeAnchor] = useState<DOMRect>();
	const onMode = (e: MouseEvent<HTMLButtonElement>) =>
		setModeAnchor(modeAnchor ? undefined : e.currentTarget.getBoundingClientRect());

	useEffect(() => {
		const keys: Record<string, () => void> = {
			F1: onMods, F2: onRandom, F3: onOptions,
		};
		const onKey = (e: KeyboardEvent) => {
			// Ctrl and the two keys left of Backspace (azerty's ) and =): rate down / up
			const rate = e.ctrlKey && RATE_KEYS[e.code];
			if (rate) {
				e.preventDefault();
				stepRate(rate);
				return;
			}
			const action = !e.ctrlKey && keys[e.key];
			if (!action) return;
			e.preventDefault();
			action();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onMods, onRandom, onOptions]);

	return (<>
		<div className="select-footer">
			{ENABLED_RULESETS.length > 1 && (
				<button
					type="button"
					className={`select-footer__btn is-mode${modeAnchor ? ' is-open' : ''}`}
					onClick={onMode}
				>
					<Glyph name={MODE_GLYPH[RULESETS[ruleset].mode]} className="select-footer__mode-icon" />
					<Trans>Mode</Trans>
					{variant && <span className="select-footer__active">{variant}</span>}
				</button>
			)}
			<button type="button" className="select-footer__btn is-mods" onClick={onMods}>
				<Trans>Mods</Trans>
				{active && <span className="select-footer__active">{active}</span>}
				<span className="select-footer__key">F1</span>
			</button>
			<button type="button" className="select-footer__btn is-random" onClick={onRandom}>
				<Trans>Random</Trans>
				<span className="select-footer__key">F2</span>
			</button>
			<button type="button" className="select-footer__btn is-options" onClick={onOptions}>
				<Trans>Beatmap Options</Trans>
				<span className="select-footer__key">F3</span>
			</button>
		</div>
		{/* out of the bottom bar's stacking context, over the carousel and the dock */}
		{modeAnchor && createPortal(
			<ModeSelect anchor={modeAnchor} onClose={() => setModeAnchor(undefined)} />,
			document.body,
		)}
		{modsOpen && createPortal(
			<ModSelect onClose={() => void modSelectOpen.set(false)} />,
			document.body,
		)}
	</>);
}
