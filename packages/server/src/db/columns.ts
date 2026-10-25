import { customType } from 'drizzle-orm/mysql-core';

/** A comma-separated tags column as a list. */
export const splitTags = (csv: string): string[] => csv ? csv.split(',').filter(Boolean) : [];

export const csv = (list: string[]) => list.join(',');

/** `s` matched literally inside a LIKE pattern. */
export const likeEscape = (s: string) => s.replace(/[\\%_]/g, '\\$&');

/** drizzle's mysql `json()` never parses what mysql2 returns (a string over
 *  the prepared-statement protocol); this variant does. */
export const jsonColumn = <T>() =>
	customType<{ data: T; driverData: string }>({
		dataType: () => 'json',
		toDriver: value => JSON.stringify(value),
		fromDriver: value => (typeof value === 'string' ? JSON.parse(value) : value) as T,
	})();

/** Bytes, up to 16 MB. */
type Bytes = { data: Buffer; driverData: Buffer };
export const mediumblob = customType<Bytes>({ dataType: () => 'mediumblob' });
