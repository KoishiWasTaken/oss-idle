import '../components/direct/direct.css';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { openPage } from '../globals';
import Page from '../components/page/Page';
import DirectView from '../components/direct/DirectView';

/** oss!direct: every ranked map, downloadable from inside the game. */
export default function Direct() {
	const { t } = useLingui();

	return (
		<Page
			title={<Trans>oss!direct</Trans>}
			onBack={() => openPage.set(undefined)}
			tabs={[
				{
					id: 'new',
					label: <Trans>New Releases</Trans>,
					subtitle: t`The latest ranked beatmaps`,
					render: () => <DirectView sort='new' />,
				},
				{
					id: 'played',
					label: <Trans>Most Played</Trans>,
					subtitle: t`The most played ranked beatmaps`,
					render: () => <DirectView sort='played' />,
				},
			]}
		/>
	);
}
