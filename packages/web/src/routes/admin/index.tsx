import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Dashboard from '../../pages/admin/Dashboard';

export const Route = createFileRoute('/admin/')({
	component: Dashboard,
	staticData: { title: msg`admin dashboard` },
});
