import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { terms } from '../../pages/legal/documents/terms';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/terms')({
	component: () => <LegalDocument doc={terms} />,
	staticData: { title: msg`terms` },
});
