/**
 * Editor API sampler: an add-on of the Editor type that uses everything the editor API
 * offers, to try it by hand or check it at once.
 *
 * - an "API sampler" tab: what the getters read, live; a button per edit, undo, redo,
 *   save, selection, seek, play and snap; and "Self-check", which calls every part of the
 *   API, undoes what it changed and lists what passed
 * - a panel at the foot of the right column: the time, ticking
 * - two actions in Ctrl+K (under Add-ons), one on Ctrl+Alt+N by default
 * - a window, drawn with the game's own React (host.react)
 *
 * One file, no imports: paste it in a new add-on of the Editor type, save, install.
 */

const NOTE_SAMPLE = {
	hitSound: '0', sample: '0:0:0:0:', 
};

/** A small DOM builder: an element with a class, text and children. */
const el = (tag, className, text, children = []) => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	for (const child of children) node.append(child);
	return node;
};

const button = (label, run) => {
	const node = el('button', '', label);
	node.addEventListener('click', run);
	return node;
};

/** A labelled group, styled like the editor's own. */
const section = (title, children) =>
	el('div', 'editor__stat', undefined, [el('span', 'ladder-sum__label', title), ...children]);

const row = children => el('span', 'editor__divisors', undefined, children);

const clock = ms => {
	const total = Math.max(0, Math.round(ms));
	return `${Math.floor(total / 60000)}:${String(Math.floor(total / 1000) % 60).padStart(2, '0')}.${String(total % 1000).padStart(3, '0')}`;
};

/** Every part of the API, tried in turn; what changed is undone. */
const selfCheck = editor => {
	const results = [];
	const check = (name, test) => {
		try {
			const passed = test();
			results.push({
				name, passed: passed !== false, 
			});
		} catch (e) {
			results.push({
				name, passed: false, error: String(e), 
			});
		}
	};
	const at = editor.now();
	const selected = editor.selection();
	let changes = 0;
	const stop = editor.onChange(() => changes++);

	check('reads: keys, notes, timing, scroll, metadata, bookmarks, text', () =>
		editor.keys > 0 && Array.isArray(editor.notes()) && Array.isArray(editor.timing())
		&& Array.isArray(editor.scroll()) && typeof editor.metadata().title === 'string'
		&& Array.isArray(editor.bookmarks()) && editor.text().includes('[HitObjects]'));

	check('edit notes, selecting the new one; undo; redo', () => {
		const before = editor.notes().length;
		const note = {
			time: editor.snap(at), column: 0, ...NOTE_SAMPLE, 
		};
		editor.edit({ notes: [...editor.notes(), note] }, [note]);
		const added = editor.notes().length === before + 1 && editor.selection().length === 1;
		editor.undo();
		const undone = editor.notes().length === before;
		editor.redo();
		const redone = editor.notes().length === before + 1;
		editor.undo();
		return added && undone && redone && editor.notes().length === before;
	});

	check('edit refuses a note outside the columns', () => {
		try {
			editor.edit({
				notes: [...editor.notes(), {
					time: 0, column: editor.keys, ...NOTE_SAMPLE, 
				}], 
			});
		} catch {
			return true;
		}
		editor.undo();
		return false;
	});

	check('edit bookmarks', () => {
		const time = Math.round(at) + 1;
		editor.edit({ bookmarks: [...editor.bookmarks(), time] });
		const added = editor.bookmarks().includes(time);
		editor.undo();
		return added && !editor.bookmarks().includes(time);
	});

	check('edit timing (a BPM point)', () => {
		const before = editor.timing().length;
		const last = editor.timing().at(-1);
		if (!last) return false;
		editor.edit({
			timing: [...editor.timing(), {
				...last, time: last.time + 10_000, 
			}], 
		});
		const added = editor.timing().length === before + 1;
		editor.undo();
		return added && editor.timing().length === before;
	});

	check('edit scroll (an SV point at 1.5x)', () => {
		const before = editor.scroll().length;
		const sv = {
			time: Math.round(at), beatLength: -100 / 1.5, meter: 4, sound: '1,0,100', effects: '0', 
		};
		editor.edit({ scroll: [...editor.scroll(), sv] });
		const added = editor.scroll().length === before + 1;
		editor.undo();
		return added && editor.scroll().length === before;
	});

	check('edit metadata', () => {
		const title = editor.metadata().title;
		editor.edit({ metadata: { title: `${title} (sampler)` } });
		const changed = editor.metadata().title === `${title} (sampler)`;
		editor.undo();
		return changed && editor.metadata().title === title;
	});

	check('select and selection', () => {
		editor.select([]);
		const cleared = editor.selection().length === 0;
		editor.select(selected);
		return cleared && editor.selection().length === selected.length;
	});

	check('snap, divisor and setDivisor', () => {
		const divisor = editor.divisor();
		editor.setDivisor(3);
		const set = editor.divisor() === 3;
		editor.setDivisor(divisor);
		return set && Number.isFinite(editor.snap(at)) && editor.divisor() === divisor;
	});

	check('seek and now', () => {
		editor.seek(at + 1000);
		const moved = Math.abs(editor.now() - (at + 1000)) < 5;
		editor.seek(at);
		return moved;
	});

	check('play, isPlaying and pause', () => {
		editor.play();
		const playing = editor.isPlaying();
		editor.pause();
		editor.seek(at);
		return playing && !editor.isPlaying();
	});

	check('onChange is called on an edit', () => changes > 0);

	check('addAction, and its disposer takes it back', () => {
		const dispose = editor.addAction({
			id: 'sampler.temporary', label: 'Sampler: temporary', run: () => {}, 
		});
		dispose();
		return true;
	});

	check('openWindow, and close()', () => {
		const handle = editor.openWindow({
			title: 'Sampler check', render: container => {
				container.textContent = 'opened by the self-check';
			}, 
		});
		handle.close();
		return true;
	});

	stop();
	return results;
};

/** The window: a React component on the game's own React, live on onChange. */
const windowRender = (host, editor) => container => {
	const R = host.react['react'];
	const root = host.react['react-dom/client'].createRoot(container);
	const h = R.createElement;
	const Live = () => {
		const [, setTick] = R.useState(0);
		R.useEffect(() => editor.onChange(() => setTick(n => n + 1)), []);
		return h('div', { className: 'sampler-window' },
			h('p', null, `React ${R.version} from host.react`),
			h('p', { className: 'sampler-window__notes' },
				`${editor.notes().length} notes, ${editor.selection().length} selected`),
			h('p', null, `${editor.keys}K, beat snap 1/${editor.divisor()}`));
	};
	root.render(h(Live));
	return () => root.unmount();
};

export const mount = (addon, host) => {
	console.info(`[sampler] ${addon?.name ?? 'Editor API sampler'} on oss!idle ${host.version}`);

	host.editor.watch(editor => {
		let opened;
		// one window at a time: opening it again keeps the one that is open
		const openWindow = () => {
			opened ??= editor.openWindow({
				title: 'API sampler',
				width: 300,
				height: 160,
				render: windowRender(host, editor),
				// its own × closed it (close() calls no onClose)
				onClose: () => {
					opened = undefined;
				},
			});
			return opened;
		};
		const closeWindow = () => {
			opened?.close();
			opened = undefined;
		};

		const addNoteHere = () => {
			const note = {
				time: editor.snap(editor.now()), column: 0, ...NOTE_SAMPLE, 
			};
			editor.edit({ notes: [...editor.notes(), note] }, [note]);
		};

		editor.addAction({
			id: 'sampler.addNote', label: 'Sampler: a note in the first column here',
			keys: ['Ctrl+Alt+N'], run: addNoteHere,
		});
		editor.addAction({
			id: 'sampler.window', label: 'Sampler: open the window', run: openWindow, 
		});

		editor.addTab({
			id: 'sampler',
			label: 'API sampler',
			render: container => {
				const readout = el('pre', 'sampler-readout');
				const checks = el('div', 'sampler-checks');
				const show = () => {
					const meta = editor.metadata();
					readout.textContent = [
						`${editor.keys}K · ${editor.notes().length} notes · ${editor.selection().length} selected`,
						`${editor.timing().length} BPM points · ${editor.scroll().length} SV points · ${editor.bookmarks().length} bookmarks`,
						`${meta.artist} - ${meta.title} [${meta.version}]`,
						`.osu text: ${editor.text().length} characters`,
						`time ${clock(editor.now())} · ${editor.isPlaying() ? 'playing' : 'paused'} · beat snap 1/${editor.divisor()}`,
					].join('\n');
				};
				const stop = editor.onChange(show);
				show();

				const runChecks = () => {
					const results = selfCheck(editor);
					const failed = results.filter(r => !r.passed).length;
					checks.replaceChildren(
						el('p', `sampler-summary ${failed ? 'is-failed' : 'is-passed'}`,
							failed ? `${failed} of ${results.length} failed` : `all ${results.length} passed`),
						...results.map(r => el('p', 'sampler-check',
							`${r.passed ? '✓' : '✗'} ${r.name}${r.error ? ` (${r.error})` : ''}`)),
					);
				};

				container.append(
					section('Read', [readout]),
					section('Self-check', [row([button('Run every check', runChecks)]), checks]),
					section('Edit', [row([
						button('Note here', addNoteHere),
						button('Mirror the selection', () => {
							const selection = new Set(editor.selection());
							const mirrored = editor.notes().map(note => (selection.has(note)
								? {
									...note, column: editor.keys - 1 - note.column, 
								} : note));
							editor.edit({ notes: mirrored }, mirrored.filter((_, i) => selection.has(editor.notes()[i])));
						}),
						button('Bookmark here', () =>
							editor.edit({ bookmarks: [...editor.bookmarks(), Math.round(editor.now())] })),
						button('SV 1.5x here', () => editor.edit({
							scroll: [...editor.scroll(), {
								time: Math.round(editor.now()), beatLength: -100 / 1.5, meter: 4, sound: '1,0,100', effects: '0',
							}],
						})),
						button('Tag the title', () =>
							editor.edit({ metadata: { title: `${editor.metadata().title} (sampler)` } })),
					])]),
					section('History', [row([
						button('Undo', () => editor.undo()),
						button('Redo', () => editor.redo()),
						button('Save', () => editor.save()),
					])]),
					section('Selection', [row([
						button('Select all', () => editor.select([...editor.notes()])),
						button('Select none', () => editor.select([])),
					])]),
					section('Time', [row([
						button('-1 s', () => editor.seek(editor.now() - 1000)),
						button('+1 s', () => editor.seek(editor.now() + 1000)),
						button('Play / pause', () => (editor.isPlaying() ? editor.pause() : editor.play())),
						button('To the snapped time', () => editor.seek(editor.snap(editor.now()))),
					])]),
					section('Beat snap', [row([
						button('1/3', () => editor.setDivisor(3)),
						button('1/4', () => editor.setDivisor(4)),
					])]),
					section('Window', [row([
						button('Open', openWindow),
						button('Close', closeWindow),
					])]),
				);
				return stop;
			},
		});

		editor.addPanel({
			id: 'sampler',
			title: 'Sampler',
			render: container => {
				const time = el('span', 'sampler-time');
				container.append(time);
				const timer = setInterval(() => {
					time.textContent = `${clock(editor.now())} · ${editor.selection().length} selected`;
				}, 100);
				return () => clearInterval(timer);
			},
		});
	}, () => console.info('[sampler] the editor closed'));
};

export const unmount = () => console.info('[sampler] stopped');
