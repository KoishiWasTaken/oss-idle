import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Claims from '../../pages/admin/Claims';

export const Route = createFileRoute('/admin/claims')({
	component: Claims,
	staticData: { title: msg`map claims` },
});
