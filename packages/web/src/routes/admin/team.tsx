import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Team from '../../pages/admin/Team';

export const Route = createFileRoute('/admin/team')({
	component: Team,
	staticData: { title: msg`team` },
});
