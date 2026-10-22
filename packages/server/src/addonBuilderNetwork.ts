import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

/** Ports knocked on: any answer, even a refusal, means the address is reachable. */
const PORTS = [22, 443];

// a TCP connect per target from inside the container; prints what answered
export const PROBE_SCRIPT = `
const net = require('net');
const targets = process.env.TARGETS.split(',');
let left = targets.length;
if (!left) process.exit(0);
for (const target of targets) {
	const at = target.lastIndexOf(':');
	const host = target.slice(0, at);
	const port = Number(target.slice(at + 1));
	const socket = net.connect({ host, port, timeout: 3000 });
	let done = false;
	const end = reachable => {
		if (done) return;
		done = true;
		if (reachable) console.log('reachable ' + target);
		socket.destroy();
		if (--left === 0) process.exit(0);
	};
	socket.on('connect', () => end(true));
	socket.on('timeout', () => end(false));
	socket.on('error', e => end(e.code === 'ECONNREFUSED' || e.code === 'ECONNRESET'));
}`;

/** The host's default route gateway (the LAN router), from /proc/net/route. */
const defaultGateway = () => {
	try {
		const route = readFileSync('/proc/net/route', 'utf8').split('\n')
			.map(line => line.trim().split(/\s+/))
			.find(cols => cols[1] === '00000000' && cols[2] !== '00000000');
		if (!route) return [];
		const hex = route[2]!;
		return [[6, 4, 2, 0].map(i => parseInt(hex.slice(i, i + 2), 16)).join('.')];
	} catch {
		return [];
	}
};

/**
 * What a build container must not reach: this host on every address (the build
 * network's own gateway included), the LAN router, and ADDON_BUILDER_PROBES (host:port,…).
 */
export const isolationTargets = (dockerGateways: string[]) => {
	const own = Object.values(networkInterfaces()).flat()
		.filter(a => a && a.family === 'IPv4' && !a.internal)
		.map(a => a!.address);
	const hosts = [...new Set([...dockerGateways, ...own, ...defaultGateway()])];
	const extra = (process.env.ADDON_BUILDER_PROBES ?? '').split(',')
		.map(s => s.trim())
		.filter(Boolean);
	return [...hosts.flatMap(host => PORTS.map(port => `${host}:${port}`)), ...extra];
};

