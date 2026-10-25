import './AuthBackdrop.css';
import type { ReactNode } from 'react';
import { Asset } from '../router';
import Link from './Link';

/** Sign in and welcome: a card over the intro video, filling the window. */
export default function AuthBackdrop({ children }: { children?: ReactNode }) {
	return (
		<div className="auth">
			<video className="auth__video" src={Asset('/intro.mp4')} autoPlay muted loop playsInline />
			<div className="auth__scrim" />
			<Link to="/" className="auth__back">← oss!idle</Link>
			{children && <main className="auth__card">{children}</main>}
		</div>
	);
}
