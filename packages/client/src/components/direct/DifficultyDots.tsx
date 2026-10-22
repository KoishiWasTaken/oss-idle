import {
	difficultyColor,
	isDarkDifficulty,
} from '@oss-idle/shared/display/difficulty';
import type { VersionMetadata } from '../../osu/beatmap/beatmap_api';

/** A set's difficulties, easiest first. */
export default function DifficultyDots({ versions }: { versions: VersionMetadata[] }) {
	return (
		<span className='direct-dots'>
			{[...versions]
				.sort((a, b) => a.difficulty - b.difficulty)
				.map(v => (
					<span
						key={v.id}
						className={`direct-dots__dot ${isDarkDifficulty(v.difficulty) ? 'is-dark' : ''}`}
						style={{ backgroundColor: difficultyColor(v.difficulty) }}
					/>
				))}
		</span>
	);
}
