/** The FFT's twiddle factors for a size, made once. */
const twiddles = new Map<number, { cos: Float32Array, sin: Float32Array }>();
const twiddlesOf = (n: number) => {
	let table = twiddles.get(n);
	if (!table) {
		table = {
			cos: new Float32Array(n / 2).map((_, k) => Math.cos(-2 * Math.PI * k / n)),
			sin: new Float32Array(n / 2).map((_, k) => Math.sin(-2 * Math.PI * k / n)),
		};
		twiddles.set(n, table);
	}
	return table;
};

/** In-place radix-2 FFT of `re` / `im` (length a power of 2). */
export const fft = (re: Float32Array, im: Float32Array) => {
	const n = re.length;
	const { cos, sin } = twiddlesOf(n);
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			const r = re[i]; re[i] = re[j]; re[j] = r;
			const m = im[i]; im[i] = im[j]; im[j] = m;
		}
	}
	for (let size = 2; size <= n; size <<= 1) {
		const half = size / 2;
		const step = n / size;
		for (let start = 0; start < n; start += size) {
			for (let k = 0; k < half; k++) {
				const c = cos[k * step], si = sin[k * step];
				const a = start + k, b = a + half;
				const tr = re[b] * c - im[b] * si, ti = re[b] * si + im[b] * c;
				re[b] = re[a] - tr; im[b] = im[a] - ti;
				re[a] += tr; im[a] += ti;
			}
		}
	}
};
