import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
	describe,
	expect,
	it,
} from 'vitest';
import Markdown from '@oss-idle/shared/display/Markdown';

const render = (text: string, inline = false) => renderToStaticMarkup(createElement(Markdown, {
	text, inline, 
}))
	.replace(/^<div class="markdown">|<\/div>$/g, '');

describe('Markdown', () => {
	it('never renders raw HTML', () => {
		expect(render('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
	});

	it('only links http(s)', () => {
		expect(render('[x](javascript:alert(1)) [y](https://a.b/c)'))
			.toBe('<p>[x](javascript:alert(1)) <a href="https://a.b/c" target="_blank" rel="noreferrer">y</a></p>');
	});

	it('nests inline styles and keeps snake_case', () => {
		expect(render('**a *b* c** `c*d*` snake_case_name'))
			.toBe('<p><strong>a <em>b</em> c</strong> <code>c*d*</code> snake_case_name</p>');
	});

	it('splits paragraphs, headings and lists', () => {
		expect(render('# T\nline 1\nline 2\n\n- a\n- b\n1. c'))
			.toBe('<h3>T</h3><p>line 1<br/>line 2</p><ul><li>a</li><li>b</li></ul><ol><li>c</li></ol>');
	});

	it('flattens to one run inline', () => {
		expect(render('# T\n\n- **a**\n- b', true)).toBe('T <strong>a</strong>, b');
	});
});
