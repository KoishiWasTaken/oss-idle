import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { rules } from '../../pages/legal/documents/rules';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/rules')({
	component: () => <LegalDocument doc={rules} />,
	staticData: { title: msg`rules` },
});
