/** Credential resolution — picks the right TokenSource for the environment. */

import type { NoveraConfig } from "../config.js";
import { NoveraAuthError } from "../errors.js";
import { patFromEnv } from "./env-pat.js";
import { OAuthTokenSource } from "./oauth-token-source.js";
import { readCredential } from "./store.js";
import type { TokenSource } from "./token-source.js";

/**
 * Resolve a token source:
 *   1. `NOVERA_API_KEY` (PAT) — headless / MCP / CI.
 *   2. a stored OAuth credential from `novera login` — interactive CLI.
 *   3. otherwise throw: the caller must authenticate.
 */
export async function resolveTokenSource(config: NoveraConfig): Promise<TokenSource> {
  const pat = patFromEnv();
  if (pat) return pat;

  const cred = await readCredential(config.env);
  if (cred) return new OAuthTokenSource(config, cred);

  throw new NoveraAuthError(
    "Not authenticated. Run `novera login`, or set NOVERA_API_KEY to a Personal Access Token.",
  );
}

export { patFromEnv, EnvPatTokenSource } from "./env-pat.js";
export { OAuthTokenSource } from "./oauth-token-source.js";
export { loginWithBrowser, type LoginOptions } from "./login.js";
export {
  readCredential,
  writeCredential,
  clearCredential,
  type StoredCredential,
} from "./store.js";
export type { TokenSource } from "./token-source.js";
export {
  generatePkce,
  generateState,
  buildAuthorizeUrl,
  exchangeCode,
  refreshAccessToken,
  type TokenResponse,
} from "./oauth-pkce.js";
