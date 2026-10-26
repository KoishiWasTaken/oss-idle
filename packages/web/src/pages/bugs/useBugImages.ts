import {
	type ClipboardEvent,
	useState,
} from 'react';

import { BUG_IMAGES_MAX } from '@oss-idle/shared/bugs';

import { uploadBugImage } from '../../api/bugs';

/** The screenshots going with a report or a reply: picked, or pasted into its text. */
export const useBugImages = () => {
	const [images, setImages] = useState<string[]>([]);
	const [uploading, setUploading] = useState(0);
	const [error, setError] = useState<string>();

	const add = async (files: File[]) => {
		const room = files
			.filter(f => f.type.startsWith('image/'))
			.slice(0, BUG_IMAGES_MAX - images.length);
		setError(undefined);
		setUploading(n => n + room.length);
		await Promise.all(room.map(async file => {
			try {
				const { url } = await uploadBugImage(file);
				setImages(cur => cur.length < BUG_IMAGES_MAX ? [...cur, url] : cur);
			} catch (e) {
				setError((e as Error).message);
			}
			setUploading(n => n - 1);
		}));
	};

	const paste = (e: ClipboardEvent) => {
		const files = [...e.clipboardData.files];
		if (files.some(f => f.type.startsWith('image/'))) void add(files);
	};

	return {
		images,
		uploading,
		error,
		add,
		paste,
		remove: (url: string) => setImages(cur => cur.filter(i => i !== url)),
		clear: () => setImages([]),
	};
};

export type BugImagesState = ReturnType<typeof useBugImages>;
