import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import type { Metadata } from '../../osu/beatmap/beatmap_api';
import { coverStyle } from './directState';
import DifficultyDots from './DifficultyDots';

type Props = {
	set: Metadata,
	selected: boolean,
	downloaded: boolean,
	/** 0..1 while downloading */
	progress?: number,
	onSelect: () => void,
	onDownload: () => void,
};

/** One set in the oss!direct list: click to see it, double click to download it. */
export default function DirectRow({
	set, selected, downloaded, progress, onSelect, onDownload,
}: Props) {
	const { i18n } = useLingui();
	const ranked = new Date(set.rankedAt).toLocaleDateString(i18n.locale, { dateStyle: 'medium' });
	const mapper = set.creator;

	return (
		<button
			type='button'
			className={[
				'direct-row',
				selected ? 'is-selected' : '',
				downloaded ? 'is-downloaded' : '',
				progress !== undefined ? 'is-downloading' : '',
			].join(' ')}
			onClick={onSelect}
			onDoubleClick={onDownload}
		>
			<span className='direct-row__cover' style={coverStyle(set)} />
			<span className='direct-row__text'>
				<span className='direct-row__title'>{set.artist} - {set.title}</span>
				<span className='direct-row__sub'>
					<Trans>mapped by {mapper}</Trans>
					<span className='direct-row__date'><Trans>Ranked {ranked}</Trans></span>
				</span>
			</span>
			<span className='direct-row__side'>
				<DifficultyDots versions={set.versions} />
				{downloaded && <FontAwesomeIcon className='direct-row__done' icon={faCheck} />}
			</span>
			{progress !== undefined && <span
				className='direct-row__progress'
				style={{ transform: `scaleX(${progress})` }}
			/>}
		</button>
	);
}
