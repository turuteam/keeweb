import * as kdbxweb from 'kdbxweb';
import { Logger } from 'util/logger';

const logger = new Logger('pkce');

interface OAuthSession {
    state: string;
    codeChallenge: string;
    codeVerifier: string;
}

let newOAuthSession: OAuthSession | undefined;

export function createOAuthSession(): OAuthSession | undefined {
    const session = newOAuthSession;

    const state = kdbxweb.ByteUtils.bytesToHex(kdbxweb.CryptoEngine.random(64));
    const codeVerifier = kdbxweb.ByteUtils.bytesToHex(kdbxweb.CryptoEngine.random(50));

    const codeVerifierBytes = kdbxweb.ByteUtils.arrayToBuffer(
        kdbxweb.ByteUtils.stringToBytes(codeVerifier)
    );
    kdbxweb.CryptoEngine.sha256(codeVerifierBytes)
        .then((hash) => {
            const codeChallenge = kdbxweb.ByteUtils.bytesToBase64(hash)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');

            newOAuthSession = {
                state,
                codeChallenge,
                codeVerifier
            };
        })
        .catch((e) => {
            logger.error('Failed to calculate hash', e);
        });

    newOAuthSession = undefined;

    return session;
}
