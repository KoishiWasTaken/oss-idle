import { createFileRoute } from '@tanstack/react-router';
import { msg } from '@lingui/core/macro';
import { getBug } from '../../api/bugs';
import BugReport from '../../pages/bugs/BugReport';

export const Route = createFileRoute('/bugs/$id')({
	loader: ({ params }) => getBug(params.id),
	component: BugRoute,
	staticData: { title: msg`bug report` },
});

function BugRoute() {
	const bug = Route.useLoaderData();
	// a new report starts with an empty reply
	return <BugReport key={bug.id} bug={bug} />;
}
