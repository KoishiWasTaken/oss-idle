import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import LevelVotes from '../../pages/levels/LevelVotes';

export const Route = createFileRoute('/maps/levels')({
	component: LevelVotes,
	staticData: { title: msg`level calibration` },
});
