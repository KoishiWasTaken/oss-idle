import type { ReactNode } from 'react';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import num from '@oss-idle/shared/display/num';
import { useShowMore } from '../../hooks/useShowMore';
import ShowMoreLink from '../ShowMoreLink';
import MapsetCard, { type Mapset } from '../MapsetCard';

type Props = {
	title: ReactNode,
	count: () => Promise<number>,
	page: (page: number) => Promise<{ items: Mapset[], hasMore: boolean }>,
	deps: unknown[],
};

/** One list of the profile's beatmaps block, left out while it is empty. */
export default function CharacterMapsSection({ title, count, page, deps }: Props) {
	const total = useAsync(count, deps);
	const maps = useShowMore(page, deps);
	if (!total) return null;

	return <div className='character__block-section'>
		<div className='character__block-section-title'>
			{title}
			<div className='character__block-section-title-count'>{num(total)}</div>
		</div>
		<div className='list__beatmap-container'>
			{maps.items?.map(mapset => <MapsetCard key={mapset.id} mapset={mapset} />)}
		</div>
		<ShowMoreLink {...maps} onClick={maps.more} />
	</div>;
}
