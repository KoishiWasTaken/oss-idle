import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as jsxRuntime from 'react/jsx-runtime';
import { VERSION } from '@oss-idle/shared/version';
import {
	editorHost,
	type EditorHost,
} from '../editor/editorHost';

/**
 * What the game hands its add-ons: its version, its own React (so an add-on bundles
 * none: the SDK's `sharedReact` reads it from `globalThis.ossIdle`), and the editor
 * for add-ons of the Editor type. `mount` gets an add-on's own copy, which drops
 * whatever the add-on left registered when it stops.
 */
export type AddonHost = {
	version: string,
	/** React's modules by import path: 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime' */
	react: Record<string, unknown>,
	editor: EditorHost,
};

const react = {
	react: React, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient, 'react/jsx-runtime': jsxRuntime,
};

declare global {
	var ossIdle: AddonHost;
}

globalThis.ossIdle = {
	version: VERSION,
	react,
	editor: editorHost,
};

/** One add-on's host, and what lets go of everything it registered through it. */
export const hostFor = (): { host: AddonHost, release: () => void } => {
	const watching = new Set<() => void>();
	return {
		host: {
			version: VERSION,
			react,
			editor: {
				watch: (onOpen, onClose) => {
					const stop = editorHost.watch(onOpen, onClose);
					watching.add(stop);
					return () => {
						watching.delete(stop);
						stop();
					};
				},
			},
		},
		release: () => {
			for (const stop of watching) stop();
			watching.clear();
		},
	};
};
