import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { copyright } from '../../pages/legal/documents/copyright';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/copyright')({
	component: () => <LegalDocument doc={copyright} />,
	staticData: { title: msg`copyright` },
});
