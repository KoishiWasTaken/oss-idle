import { useState } from 'react';

/** Run one request at a time, keeping its error to show; `after` (a refresh) runs once it worked. */
export const useAction = () => {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const run = async (action: () => Promise<unknown>, after?: () => unknown) => {
		setBusy(true);
		setError(undefined);
		try {
			await action();
			await after?.();
		} catch (e) {
			setError(String((e as Error | undefined)?.message ?? e));
		} finally {
			setBusy(false);
		}
	};
	return {
		busy, error, setError, run,
	};
};
