import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import Settings from '../pages/settings/Settings';

const settingsSearch = z.object({
	// what the itch.io claim just gave: seconds of supporter, or 'error'
	itch: z.union([z.literal('error'), z.coerce.number().int().min(0)]).optional(),
});

export const Route = createFileRoute('/settings')({
	validateSearch: zodValidator(settingsSearch),
	component: SettingsRoute,
	staticData: { title: msg`settings` },
});

function SettingsRoute() {
	const { itch } = Route.useSearch();
	return <Settings itch={itch} />;
}
