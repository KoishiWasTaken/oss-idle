import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Restrictions from '../../pages/admin/Restrictions';

export const Route = createFileRoute('/admin/restrictions')({
	component: Restrictions,
	staticData: { title: msg`restricted accounts` },
});
