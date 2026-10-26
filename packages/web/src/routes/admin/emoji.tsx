import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import Emoji from '../../pages/admin/Emoji';

export const Route = createFileRoute('/admin/emoji')({
	component: Emoji,
	staticData: { title: msg`emoji` },
});
