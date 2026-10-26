import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Logout from '../pages/Logout';

export const Route = createFileRoute('/logout')({
	component: Logout,
	staticData: { title: msg`logging out...` },
});
