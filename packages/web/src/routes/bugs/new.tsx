import { createFileRoute } from '@tanstack/react-router';
import { msg } from '@lingui/core/macro';
import NewBug from '../../pages/bugs/NewBug';

export const Route = createFileRoute('/bugs/new')({
	component: NewBug,
	staticData: { title: msg`report a bug` },
});
