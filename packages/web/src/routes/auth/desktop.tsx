import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import DesktopDone from '../../pages/DesktopDone';

export const Route = createFileRoute('/auth/desktop')({
	component: DesktopDone,
	staticData: { title: msg`signed in` },
});
