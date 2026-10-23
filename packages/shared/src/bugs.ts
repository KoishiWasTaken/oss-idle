import { z } from 'zod';

export const BUG_STATUS = ['open', 'confirmed', 'fixed', 'closed'] as const;
export type BugStatus = typeof BUG_STATUS[number];

export const BUG_TEXT_MAX = 5000;
export const BUG_IMAGES_MAX = 3;

/** Images uploaded with `POST /v1/bugs/image`. */
const images = z.array(z.string().regex(/^\/uploads\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/))
	.max(BUG_IMAGES_MAX)
	.optional();

export const bugReportBody = z.object({
	title: z.string().trim().min(1).max(120),
	body: z.string().trim().min(1).max(BUG_TEXT_MAX),
	images,
	/** the game's version and the browser or app it runs in */
	version: z.string().max(32),
	client: z.string().max(500),
});
export type BugReportBody = z.infer<typeof bugReportBody>;

/** A reply; the team may change the status with it, or only change the status. */
export const bugMessageBody = z.object({
	body: z.string().trim().max(BUG_TEXT_MAX),
	images,
	status: z.enum(BUG_STATUS).optional(),
}).refine(m => m.body || m.images?.length || m.status, { message: 'Write a message' });
export type BugMessageBody = z.infer<typeof bugMessageBody>;
