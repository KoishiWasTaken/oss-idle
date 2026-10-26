import './ChatUserMenu.css';

import {
	useEffect,
	useState,
} from 'react';

import type { ModerateBody } from '../../api/chat';
import { SILENCE_LENGTHS } from '../../components/character/silenceLengths';

type Props = {
	x: number;
	y: number;
	channel: string;
	characterId: number;
	messageId: string;
	banned: boolean;
	timedOut: boolean;
	onAction: (body: ModerateBody) => void;
	onClose: () => void;
};

export default function ChatUserMenu(props: Props) {
	const {
		x, y, channel, characterId, messageId, banned, timedOut, onAction, onClose,
	} = props;

	useEffect(() => {
		const onDown = () => onClose();
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		window.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	}, [onClose]);

	const [reason, setReason] = useState('');

	const act = (body: ModerateBody) => {
		onAction(body);
		onClose();
	};

	return (
		<div
			className='chat-menu'
			style={{
				left: x, top: y, 
			}}
			onPointerDown={e => e.stopPropagation()}
		>
			<input
				className='chat-menu__reason'
				value={reason}
				onChange={e => setReason(e.target.value)}
				maxLength={255}
				placeholder='Reason (account standing)'
			/>
			<span className='chat-menu__label'>Timeout</span>
			<div className='chat-menu__timeouts'>
				{SILENCE_LENGTHS.map(t => (
					<button
						key={t.seconds}
						onClick={() => act({
							action: 'timeout', characterId, seconds: t.seconds, reason, channel, messageId,
						})}
					>{t.label}</button>
				))}
			</div>

			{timedOut && (
				<button
					className='chat-menu__item'
					onClick={() => act({
						action: 'untimeout', characterId,
					})}
				>Remove timeout</button>
			)}

			{banned ? (
				<button
					className='chat-menu__item'
					onClick={() => act({
						action: 'unban', characterId,
					})}
				>Unban</button>
			) : (
				<button
					className='chat-menu__item danger'
					onClick={() => act({
						action: 'ban', characterId, reason, channel, messageId,
					})}
				>Ban from chat</button>
			)}

			<button
				className='chat-menu__item'
				onClick={() => act({
					action: 'delete', channel, ids: [messageId],
				})}
			>Delete message</button>
			<button
				className='chat-menu__item danger'
				onClick={() => act({
					action: 'deleteDay', channel, characterId,
				})}
			>Delete all today</button>
		</div>
	);
}
