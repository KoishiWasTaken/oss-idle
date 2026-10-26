import useSynced from '@oss-idle/shared/hooks/useSynced';
import type { Mod } from '@oss-idle/shared/mods';
import { versionLabel } from '@oss-idle/shared/rate';

import { selectedRate } from '../gameplay/playRate';

/** " [Beginner x1.3 +HR]": a difficulty at the rate it's played at - the picked one,
 *  unless the play's own is known - with a playlist's locked mods. */
export default function RatedVersion({
	version, rate, mods,
}: { version: string, rate?: number, mods?: Mod[] }) {
	const [picked] = useSynced(selectedRate);
	return <span> [{versionLabel(version, rate ?? picked ?? 1, mods)}]</span>;
}
