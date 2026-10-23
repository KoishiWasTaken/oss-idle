import { createFileRoute } from '@tanstack/react-router';
import { msg } from '@lingui/core/macro';
import MyBugs from '../../pages/bugs/MyBugs';

export const Route = createFileRoute('/bugs/')({
	component: MyBugs,
	staticData: { title: msg`bug reports` },
});
