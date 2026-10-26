import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Orders from '../../pages/admin/Orders';

export const Route = createFileRoute('/admin/orders')({
	component: Orders,
	staticData: { title: msg`supporter orders` },
});
