import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Bugs from '../../pages/admin/Bugs';

export const Route = createFileRoute('/admin/bugs')({
	component: Bugs,
	staticData: { title: msg`bug reports` },
});
