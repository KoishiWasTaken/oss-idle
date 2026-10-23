import { createFileRoute } from '@tanstack/react-router';
import { msg } from '@lingui/core/macro';
import AddonDocs from '../pages/docs/addons/AddonDocs';

export const Route = createFileRoute('/docs_/addons')({
	component: AddonDocs,
	staticData: { title: msg`Add-on documentation` },
});
