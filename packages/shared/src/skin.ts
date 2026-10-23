import { z } from 'zod';
import {
	mapped,
	type ValueIn,
} from './helpers/mapped.js';
import {
	semver,
	tags,
} from './addon.js';

export const SkinStatuses = [
	'UNPUBLISHED',
	'PUBLISHED',
] as const;
export const SKIN_STATUS = mapped(SkinStatuses);
export type SkinStatus = ValueIn<typeof SKIN_STATUS>;

export const skinCreateBody = z.object({
	name: z.string().trim().min(1).max(80),
	description: z.string().trim().max(500).default(''),
	tags: tags.default([]),
	version: semver.default('0.1.0'),
	icon: z.string().max(512).nullable(),
	definition: z.string().min(1),
});
export type SkinCreateBody = z.infer<typeof skinCreateBody>;

export const skinUpdateBody = skinCreateBody.partial();
export type SkinUpdateBody = z.infer<typeof skinUpdateBody>;

export const skinModerateBody = z.object({ status: z.enum(SkinStatuses) });
export type SkinModerateBody = z.infer<typeof skinModerateBody>;