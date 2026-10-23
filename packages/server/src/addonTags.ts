import { ADDON_TAG } from '@oss-idle/shared/addon';
import compareVersions from '@oss-idle/shared/helpers/compareVersions';

const version = (tag: string) => ADDON_TAG.exec(tag)![1]!;

const compareTags = (a: string, b: string) => compareVersions(version(a), version(b));

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
