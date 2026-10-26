import type { AdminMetrics } from '../../../api/admin';
import {
	bytes,
	dayClock,
	ms,
	num,
} from './format';
import Panel from './Panel';
import TimeChart from './TimeChart';

type Props = { metrics: AdminMetrics };

const gauge = (values: number[]) => values.map(v => (v ? v : undefined));

const diskNote = (disk: NonNullable<AdminMetrics['disk']>) => {
	const note = `${bytes(disk.free)} free of ${bytes(disk.total)}`;
	if (disk.freePerDay === undefined) return note;
	return `${note} · ${disk.freePerDay > 0 ? '-' : '+'}${bytes(Math.abs(disk.freePerDay))}/day`;
};

/** The API server itself: load, memory, the event loop, Redis, MySQL and its disk. */
export default function SystemLoad({ metrics }: Props) {
	const s = metrics.system;
	const disk = metrics.disk;
	const chart = {
		start: metrics.start, bucketMs: metrics.bucketMs, height: 130,
	};
	return (
		<Panel title='API server' note='Highest value in each 5 minutes'>
			<div className='admin-dashboard__grid admin-dashboard__grid--small'>
				<TimeChart
					{...chart}
					title='Load'
					note='1-minute average, 8 cores'
					format={v => v.toFixed(1)}
					floor={1}
					series={[{
						label: 'Load', slot: 1, values: gauge(s.load1),
					}]}
				/>
				<TimeChart
					{...chart}
					title='Memory used'
					format={v => `${Math.round(v)}%`}
					floor={100}
					series={[{
						label: 'Memory', slot: 1, values: gauge(s.mem),
					}]}
				/>
				<TimeChart
					{...chart}
					title='Event loop delay'
					note='99th percentile, worst worker'
					format={ms}
					series={[{
						label: 'Delay', slot: 2, values: gauge(s.lag_p99),
					}]}
				/>
				<TimeChart
					{...chart}
					title='Redis'
					note='memory'
					format={v => `${Math.round(v)} MB`}
					series={[{
						label: 'Memory', slot: 1, values: gauge(s.redis_mb),
					}]}
				/>
				<TimeChart
					{...chart}
					title='Redis'
					note='commands per second'
					format={num}
					series={[{
						label: 'Commands', slot: 3, values: gauge(s.redis_ops),
					}]}
				/>
				<TimeChart
					{...chart}
					title='MySQL connections'
					format={num}
					series={[
						{
							label: 'Open', slot: 1, values: gauge(s.db_threads_connected),
						},
						{
							label: 'Running', slot: 2, values: gauge(s.db_threads_running),
						},
					]}
				/>
				{disk && <TimeChart
					start={disk.start}
					bucketMs={disk.bucketMs}
					height={130}
					title='Disk used, 30 days'
					note={diskNote(disk)}
					format={bytes}
					floor={disk.total}
					tickMs={disk.used.length > 72 ? 7 * 86_400_000 : 6 * 3_600_000}
					time={dayClock}
					series={[{
						label: 'Used', slot: 1, values: gauge(disk.used),
					}]}
				/>}
			</div>
		</Panel>
	);
}
