import type { ValidationTargets } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const idParam = z.coerce.number().int().positive();

/** zValidator that re-throws the ZodError, so the app's onError answers its standard 400. */
export const valid = <Target extends keyof ValidationTargets, T extends z.ZodType>(
	target: Target, schema: T,
) =>
	zValidator(target, schema, r => {
		if (!r.success) throw r.error;
	});
