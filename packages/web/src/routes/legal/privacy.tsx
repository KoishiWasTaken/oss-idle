import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { privacy } from '../../pages/legal/documents/privacy';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/privacy')({
	component: () => <LegalDocument doc={privacy} />,
	staticData: { title: msg`privacy` },
});
