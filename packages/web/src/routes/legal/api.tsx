import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { api } from '../../pages/legal/documents/api';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/api')({
	component: () => <LegalDocument doc={api} />,
	staticData: { title: msg`API terms of use` },
});
