export { useAction } from '@oss-idle/shared/hooks/useAction';

/** The callback URLs as typed, one per line. */
export const callbackUrls = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);
