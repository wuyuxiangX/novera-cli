/**
 * Interactive browser login. Spins up the loopback server, opens the consent
 * page, exchanges the returned code, and persists the credential.
 *
 * `openBrowser` is injected so core stays free of the `open` dependency — the
 * CLI passes it in.
 */

import type { NoveraConfig } from "../config.js";
import { NoveraAuthError } from "../errors.js";
import { startLoopbackServer } from "./loopback.js";
import { buildAuthorizeUrl, exchangeCode, generatePkce, generateState } from "./oauth-pkce.js";
import { writeCredential, type StoredCredential } from "./store.js";

export interface LoginOptions {
  /** Open the consent URL in the user's browser. */
  openBrowser: (url: string) => void | Promise<void>;
  /** Called with the authorize URL (e.g. to print it as a fallback). */
  onAuthorizeUrl?: (url: string) => void;
  /** Abort if the user never completes consent. Default 5 minutes. */
  timeoutMs?: number;
}

export async function loginWithBrowser(
  config: NoveraConfig,
  options: LoginOptions,
): Promise<StoredCredential> {
  const server = await startLoopbackServer();
  try {
    const { verifier, challenge } = generatePkce();
    const state = generateState();
    const authorizeUrl = buildAuthorizeUrl(config, {
      redirectUri: server.redirectUri,
      challenge,
      state,
    });

    options.onAuthorizeUrl?.(authorizeUrl);
    await options.openBrowser(authorizeUrl);

    const code = await withTimeout(server.waitForCallback(state), options.timeoutMs ?? 5 * 60_000);

    const tokens = await exchangeCode(config, {
      code,
      redirectUri: server.redirectUri,
      verifier,
    });

    const cred: StoredCredential = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope,
      env: config.env,
    };
    await writeCredential(cred);
    return cred;
  } finally {
    server.close();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new NoveraAuthError("Login timed out waiting for browser consent.")),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
