import './AuthCallback.css';

import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ph } from '@lingui/core/macro';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import useAsync from '@oss-idle/shared/hooks/useAsync';
import { GUEST_AVATAR_URL } from '@oss-idle/shared/osu/profile';

import { takeReturnPath } from '../auth';
import AuthBackdrop from '../components/AuthBackdrop';
import {
	detectPlatform,
	fetchManifest,
	PLATFORM_LABEL,
	resolveDownload,
} from '../download';
import { pageTitle } from '../globals';
import { useCurrentUser } from '../hooks/useCurrentUser';

/** osu! → API → here. The API already set the session cookie; this page just
 * notifies the game (same-origin localStorage ping) and closes the popup. */
export default function AuthCallback() {
	const navigate = useNavigate();
	useEffect(() => {
		try {
			localStorage.setItem('oss-idle:auth', String(Date.now()));
		} catch {
			void navigate({ to: '/auth/error' });
			return;
		}

		// In-game flow opens this as a popup → close it. The top-level landing
		// flow runs in the tab itself → drop the player into the game (origin
		// root), now signed in.
		if (window.opener && window.opener !== window) {
			window.close();
			return;
		}
		const back = takeReturnPath();
		if (back) window.location.replace(back);
        
	}, []);

	const { t } = useLingui();
	const user = useCurrentUser();

	useEffect(() => {
		pageTitle.set(user ? t`welcome` : t`one moment...`);
		return () => void pageTitle.set('');
	}, [user, t]);

	const platform = detectPlatform();
	const manifest = useAsync(fetchManifest, []);
	const { version, primary } = resolveDownload(manifest ?? null, platform);

	if (!user) return <AuthBackdrop />;

	return (
		<AuthBackdrop>
			<img className="welcome__avatar" src={user.avatarUrl ?? GUEST_AVATAR_URL} alt="" />
			<h1><Trans>Welcome, {ph({ username: user.username })}!</Trans></h1>
			{primary
				? <>
					<p className="auth__text">
						<Trans>Your account is ready. Get the desktop app: best for performance and idling.</Trans>
					</p>
					<a className="cta-button welcome__cta" href={primary.href} download>
						<FontAwesomeIcon icon={faDownload} />
						<span className="welcome__download">
							<Trans>Download for {ph({ platform: primary.label })}</Trans>
							<small>v{version}</small>
						</span>
					</a>
					<a className="auth__link" href="/"><Trans>or play in the browser</Trans></a>
				</>
				: <>
					<p className="auth__text"><Trans>Your account is ready.</Trans></p>
					<a className="cta-button welcome__cta" href="/"><Trans>Play in the browser</Trans></a>
					<p className="auth__fine">
						<Trans>The desktop app is not yet available for {ph({ platform: PLATFORM_LABEL[platform] })}.</Trans>
					</p>
				</>}
		</AuthBackdrop>
	);
}
