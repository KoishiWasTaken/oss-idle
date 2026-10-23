export const formatDate = (iso: string | null): string =>
	iso ? new Date(iso).toLocaleString(undefined, {
		dateStyle: 'medium', timeStyle: 'short',
	}) : '—';
