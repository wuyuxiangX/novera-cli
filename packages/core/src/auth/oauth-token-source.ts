/**
 * OAuth-backed token source. Reads the stored credential, returns the access
 * token while valid, and silently refreshes (single-flight) when it is within
 * the expiry buffer. If refresh fails, the credential is cleared and the caller
 * is told to log in again.
 */

import type { NoveraConfig } from "../config.js";
import { NoveraAuthError } from "../errors.js";
import { refreshAccessToken } from "./oauth-pkce.js";
import { clearCredential, writeCredential, type StoredCredential } from "./store.js";
import type { TokenSource } from "./token-source.js";

/** Refresh this many ms before the token actually expires. */
const EXPIRY_BUFFER_MS = 5 * 60_000;

export class OAuthTokenSource implements TokenSource {
  private cred: StoredCredential;
  private refreshing: Promise<string> | null = null;

  constructor(
    private readonly config: NoveraConfig,
    cred: StoredCredential,
  ) {
    this.cred = cred;
  }

  async getToken(): Promise<string> {
    if (Date.now() < this.cred.expiresAt - EXPIRY_BUFFER_MS) {
      return this.cred.accessToken;
    }
    if (!this.cred.refreshToken) {
      await clearCredential(this.config.env);
      throw new NoveraAuthError("Session expired. Run `novera login` again.");
    }
    // Single-flight: concurrent callers share one refresh.
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async doRefresh(): Promise<string> {
    try {
      const tokens = await refreshAccessToken(this.config, this.cred.refreshToken!);
      this.cred = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? this.cred.refreshToken,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope ?? this.cred.scope,
        env: this.config.env,
      };
      await writeCredential(this.cred);
      return this.cred.accessToken;
    } catch (err) {
      await clearCredential(this.config.env);
      throw new NoveraAuthError(
        `Session refresh failed (${(err as Error).message}). Run \`novera login\` again.`,
      );
    }
  }
}
