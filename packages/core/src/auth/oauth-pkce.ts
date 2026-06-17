/**
 * OAuth 2.0 Authorization Code + PKCE primitives (RFC 6749 / 7636).
 *
 * Pure, transport-agnostic helpers: generate the PKCE pair, build the browser
 * authorize URL, and exchange / refresh tokens against `POST /oauth/token`
 * (form-encoded). The interactive browser dance lives in `login.ts`.
 */

import { createHash, randomBytes } from "node:crypto";

import type { NoveraConfig } from "../config.js";
import { NoveraAuthError } from "../errors.js";

export interface PkcePair {
  verifier: string;
  challenge: string;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function generatePkce(): PkcePair {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateState(): string {
  return base64url(randomBytes(16));
}

export interface AuthorizeUrlParams {
  redirectUri: string;
  challenge: string;
  state: string;
}

export function buildAuthorizeUrl(config: NoveraConfig, params: AuthorizeUrlParams): string {
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** RFC 6749 §5.1 token response. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

async function postToken(
  config: NoveraConfig,
  form: Record<string, string>,
): Promise<TokenResponse> {
  const resp = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
  const body = (await resp.json().catch(() => ({}))) as TokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!resp.ok || !body.access_token) {
    const detail = body.error_description || body.error || `HTTP ${resp.status}`;
    throw new NoveraAuthError(`Token request failed: ${detail}`);
  }
  return body;
}

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  verifier: string;
}

export function exchangeCode(
  config: NoveraConfig,
  params: ExchangeCodeParams,
): Promise<TokenResponse> {
  return postToken(config, {
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: config.clientId,
    code_verifier: params.verifier,
  });
}

export function refreshAccessToken(
  config: NoveraConfig,
  refreshToken: string,
): Promise<TokenResponse> {
  return postToken(config, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });
}
