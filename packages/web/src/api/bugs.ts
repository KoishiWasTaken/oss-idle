import type {
	BugMessageBody,
	BugReportBody,
	BugStatus,
} from '@oss-idle/shared/bugs';
import {
	apiUrl,
	json,
	rpc,
	unwrap,
	withAuth,
} from './client';

export const myBugs = () => unwrap(rpc.v1.bugs.$get());

export type BugRow = Awaited<ReturnType<typeof myBugs>>[number];

/** Admins: every report in these statuses (default: all but closed). */
export const allBugs = (statuses?: BugStatus[]) =>
	unwrap(rpc.v1.bugs.admin.$get({ query: { status: statuses?.join(',') } }));

export const getBug = (id: string) => unwrap(rpc.v1.bugs[':id'].$get({ param: { id } }));

export type Bug = Awaited<ReturnType<typeof getBug>>;

export const reportBug = (body: BugReportBody) => unwrap(rpc.v1.bugs.$post({ json: body }));

export const answerBug = (id: number, body: BugMessageBody) =>
	unwrap(rpc.v1.bugs[':id'].messages.$post({
		param: { id: String(id) }, json: body,
	}));

/** The player's reports with a team answer they haven't opened yet. */
export const unreadBugs = () => unwrap(rpc.v1.bugs.unread.$get());

/** Upload a screenshot; its path goes with the report or the reply. */
export const uploadBugImage = async (file: File) => {
	const form = new FormData();
	form.append('file', file);
	return json<{ url: string }>(await fetch(apiUrl('/v1/bugs/image'), withAuth({
		method: 'POST', body: form,
	})));
};
