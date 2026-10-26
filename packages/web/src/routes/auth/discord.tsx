import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import DiscordLinked from '../../pages/DiscordLinked';

export const Route = createFileRoute('/auth/discord')({
	component: DiscordLinked,
	staticData: { title: msg`Discord linked` },
});
