import compareVersions from '@oss-idle/shared/helpers/compareVersions';

// changelog/<major>/<minor>/<patch>/<version>.md, written at each version bump:
// the date, a blank line, then one `add|change|fix[!] [Category] title[ (#PR)][ by @github]`
// line per entry (`!` = major; PR and author credit a contributor, as on osu!).
const files = import.meta.glob<string>([
	'../../../../../changelog/**/*.md',
	'!../../../../../changelog/pending/**',
], {
	query: '?raw', import: 'default', eager: true,
});

export const ENTRY = /^(add|change|fix)(!?) \[([^\]]+)\] (.+?)(?: \(#(\d+)\))?(?: by @([\w-]+))?$/;

export type Entry = {
	type: 'add' | 'change' | 'fix'; major: boolean; category: string; title: string;
	pr?: number; author?: string;
};
export type Build = { version: string; date: string; entries: Entry[] };

export const BUILDS: Build[] = Object.entries(files)
	.map(([path, raw]) => {
		const [date, ...lines] = raw.split('\n');
		return {
			version: path.slice(path.lastIndexOf('/') + 1, -'.md'.length),
			date: date.trim(),
			entries: lines.flatMap(line => {
				const m = ENTRY.exec(line.trim());
				return m ? [{
					type: m[1] as Entry['type'], major: m[2] === '!', category: m[3], title: m[4],
					pr: m[5] ? Number(m[5]) : undefined, author: m[6],
				}] : [];
			}),
		};
	})
	.sort((a, b) => compareVersions(b.version, a.version));
