import { ADDON_TAG } from '@oss-idle/shared/addon';

const version = (tag: string) => ADDON_TAG.exec(tag)![1]!.split('.').map(Number);

const compareTags = (a: string, b: string) => {
	const [va, vb] = [version(a), version(b)];
	const i = va.findIndex((n, i) => n !== vb[i]);
	return i < 0 ? 0 : va[i]! - vb[i]!;
};

/** The newest version tag and the commit it points at, from `git ls-remote --tags`. */
export const newestTag = (lsRemote: string) => {
	const commits = new Map<string, string>();
	for (const line of lsRemote.split('\n')) {
		const [sha, ref] = line.split('\t');
		// the git server writes these lines: a sha is only ever handed to git as a commit
		if (!/^[0-9a-f]{40}$/.test(sha ?? '') || !ref?.startsWith('refs/tags/')) continue;
		const peeled = ref.endsWith('^{}');
		const tag = ref.slice('refs/tags/'.length).replace(/\^\{\}$/, '');
		// an annotated tag's own sha is not a commit: its peeled line wins
		if (ADDON_TAG.test(tag) && (peeled || !commits.has(tag))) commits.set(tag, sha);
	}
	const tag = [...commits.keys()].sort(compareTags).at(-1);
	return tag ? {
		tag, commit: commits.get(tag)!,
	} : undefined;
};
