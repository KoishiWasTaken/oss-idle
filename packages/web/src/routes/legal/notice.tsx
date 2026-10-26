import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';

import { notice } from '../../pages/legal/documents/notice';
import LegalDocument from '../../pages/legal/LegalDocument';

export const Route = createFileRoute('/legal/notice')({
	component: () => <LegalDocument doc={notice} />,
	staticData: { title: msg`legal notice` },
});
