import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';

import { ApiError } from '@oss-idle/shared/apiBase';

/** A page that doesn't exist, or that failed to load (the server says why). */
export default function PageError({ error }: { error?: Error }) {
	const missing = !error || (error instanceof ApiError && error.status === 404);

	// the SPA answers 200 for everything, so tell crawlers this isn't a page
	useEffect(() => {
		if (!missing) return;
		const meta = document.createElement('meta');
		meta.name = 'robots';
		meta.content = 'noindex';
		document.head.appendChild(meta);
		return () => meta.remove();
	}, [missing]);

	return <div className='page-contents'>
		{error ? error.message : <Trans>This page doesn't exist.</Trans>}
	</div>;
}
