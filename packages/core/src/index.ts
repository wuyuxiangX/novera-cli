/**
 * novera-sdk — the Novera API client + auth shared by the CLI and MCP server.
 *
 *   import { createClient } from "novera-sdk";
 *   const novera = await createClient();          // resolves PAT or login token
 *   const results = await novera.search({ q: "rust" });
 */

import { NoveraClient } from "./client.js";
import { resolveConfig, type ConfigOverrides, type NoveraConfig } from "./config.js";
import { type RequestContext } from "./http.js";
import { patFromEnv } from "./auth/env-pat.js";
import { resolveTokenSource } from "./auth/index.js";
import type { TokenSource } from "./auth/token-source.js";

export interface CreateClientOptions extends ConfigOverrides {
  /** Explicit Personal Access Token (overrides NOVERA_API_KEY lookup). */
  apiKey?: string;
  /** Provide a fully custom token source (overrides apiKey + stored login). */
  tokenSource?: TokenSource;
}

/**
 * Build a NoveraClient. Token resolution order:
 *   1. an explicit `tokenSource`
 *   2. an explicit `apiKey` (or `NOVERA_API_KEY`)
 *   3. a stored OAuth credential from `novera login`
 * Throws NoveraAuthError if none is available.
 */
export async function createClient(options: CreateClientOptions = {}): Promise<NoveraClient> {
  const config = resolveConfig(options);
  const tokenSource = await resolveClientTokenSource(config, options);
  const ctx: RequestContext = {
    apiBase: config.apiBase,
    getToken: () => tokenSource.getToken(),
  };
  return new NoveraClient(ctx);
}

async function resolveClientTokenSource(
  config: NoveraConfig,
  options: CreateClientOptions,
): Promise<TokenSource> {
  if (options.tokenSource) return options.tokenSource;
  const explicitPat = patFromEnv(options.apiKey);
  if (explicitPat) return explicitPat;
  return resolveTokenSource(config);
}

export { NoveraClient } from "./client.js";
export {
  resolveConfig,
  resolveEnvironment,
  CLIENT_ID,
  SCOPE,
  type NoveraConfig,
  type NoveraEnvironment,
  type ConfigOverrides,
} from "./config.js";
export { NoveraApiError, NoveraAuthError } from "./errors.js";
export { buildUrl, request, unwrap, type RequestContext, type QueryParams } from "./http.js";
export * from "./types.js";
export {
  resolveTokenSource,
  patFromEnv,
  EnvPatTokenSource,
  OAuthTokenSource,
  loginWithBrowser,
  readCredential,
  writeCredential,
  clearCredential,
  generatePkce,
  generateState,
  buildAuthorizeUrl,
  exchangeCode,
  refreshAccessToken,
  type TokenSource,
  type LoginOptions,
  type StoredCredential,
  type TokenResponse,
} from "./auth/index.js";
