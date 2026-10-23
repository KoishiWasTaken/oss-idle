import { Trans } from '@lingui/react/macro';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import {
	getCharacterMapped,
	getCharacterNbMapped,
	getCharacterNbRankedMaps,
	getCharacterRankedMaps,
} from '../../api/characters';
import CharacterMapsSection from './CharacterMapsSection';

/** osu!'s profile beatmaps: the maps the account made, ranked and unranked, and the
 *  ranked maps it proposed. Left out when there are none. */
export default function CharacterBeatmaps({ id }: { id: string }) {
	const any = useAsync(async () => {
		const counts = await Promise.all([
			getCharacterNbMapped(id, 'ranked'),
			getCharacterNbMapped(id, 'unranked'),
			getCharacterNbRankedMaps(id),
		]);
		return counts.some(n => n > 0);
	}, [id]);
	if (!any) return null;

	return <div className='character__block'>
		<div className='character__block-title'><Trans>Beatmaps</Trans></div>
		<CharacterMapsSection
			title={<Trans>Ranked Beatmaps</Trans>}
			count={() => getCharacterNbMapped(id, 'ranked')}
			page={page => getCharacterMapped(id, 'ranked', page)}
			deps={[id]}
		/>
		<CharacterMapsSection
			title={<Trans>Unranked Beatmaps</Trans>}
			count={() => getCharacterNbMapped(id, 'unranked')}
			page={page => getCharacterMapped(id, 'unranked', page)}
			deps={[id]}
		/>
		<CharacterMapsSection
			title={<Trans>Proposed Beatmaps</Trans>}
			count={() => getCharacterNbRankedMaps(id)}
			page={page => getCharacterRankedMaps(id, page)}
			deps={[id]}
		/>
	</div>;
}
