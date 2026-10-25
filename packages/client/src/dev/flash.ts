/** A dev tool's word on screen for two seconds, over everything. */
export const flash = (message: string) => {
	const note = document.createElement('div');
	note.textContent = message;
	note.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);'
		+ 'z-index:var(--z-dev);pointer-events:none;background:rgba(0,0,0,.85);color:#cfc;'
		+ 'font:bold 22px monospace;padding:16px 28px;border-radius:8px';
	document.body.append(note);
	setTimeout(() => note.remove(), 2000);
};
