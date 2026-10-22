import './Ticker.css';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import Socket from '../../online/socket';
import ChatText from './chat/ChatText';
import { menuIdle } from '../../globals';

/** The latest chat line, shown while the overlay is closed (when enabled). */
export default function Ticker() {
	const [lines = []] = useSynced(Socket.chat);
	const [idle] = useSynced(menuIdle);
	const latest = lines[lines.length - 1];
	if (!latest) return null;
	
	const d = new Date(latest.at);
	const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

	if (latest.kind === 'system') {
		return (
			<div className={`community-ticker ${idle ? 'is-idle' : ''}`}>
				<div className="chat__line">
					<span className="chat__text" style={{ color: latest.color }}>{time} {latest.text}</span>
				</div>
			</div>
		);
	}

	return (
		<div className={`community-ticker ${idle ? 'is-idle' : ''}`}>
			<div className="chat__line">
				<span
					className="chat__from"
					style={{ color: latest.from.color }}
				>{`${time} ${latest.from.name}:`}</span>
				<ChatText text={latest.text} />
			</div>
		</div>
	);
}
