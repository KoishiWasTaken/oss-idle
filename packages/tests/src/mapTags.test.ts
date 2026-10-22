import {
	describe,
	it,
	expect,
} from 'vitest';
import { parseMapTags } from '@oss-idle/shared/beatmap';

describe('parseMapTags', () => {
	it('reads the stored tags in MAP_TAGS order', () => {
		expect(parseMapTags('')).toEqual([]);
		expect(parseMapTags('ln,sv')).toEqual(['sv', 'ln']);
		expect(parseMapTags('ln')).toEqual(['ln']);
	});

	it('drops what is not a tag', () => {
		expect(parseMapTags('sv,bundled,s')).toEqual(['sv']);
	});
});
