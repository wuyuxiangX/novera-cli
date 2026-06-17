/**
 * Novera HTTP layer.
 *
 * Ported from the Raycast extension's `lib/api.ts`. The envelope unwrapping and
 * auth-failure detection are identical; the only change is that the bearer
 * token is injected via a `getToken()` callback rather than pulled from
 * Raycast's `getAccessToken()`.
 */

import { NoveraApiError, NoveraAuthError } from "./errors.js";
import type { Envelope } from "./types.js";

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

const AUTH_ERROR_CODES = new Set([11001, 11002, 11003, 11004]);
export const RECONNECT_MESSAGE =
  "Novera connection expired. Run `novera login` again (or refresh NOVERA_API_KEY).";

type ErrorLikeBody = Partial<Envelope<unknown>> & {
  error?: string;
  error_description?: string;
};

export interface RequestContext {
  apiBase: string;
  getToken: () => Promise<string>;
  /** Invoked when a request fails authentication, before the error is thrown. */
  onAuthFailure?: () => void | Promise<void>;
}

export function buildUrl(apiBase: string, path: string, params?: QueryParams): string {
  const url = new URL(`${apiBase}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isAuthFailure(status: number, body: ErrorLikeBody): boolean {
  if (status === 401) return true;
  if (typeof body.code === "number" && AUTH_ERROR_CODES.has(body.code)) return true;
  if (/invalid_grant|invalid_token/i.test(body.error ?? "")) return true;
  const message = `${body.message ?? ""} ${body.error_description ?? ""}`;
  return /invalid token|token has been revoked|token has expired|missing bearer token/i.test(
    message,
  );
}

export async function unwrap<T>(
  resp: Response,
  onAuthFailure?: () => void | Promise<void>,
): Promise<T> {
  let body: Partial<Envelope<T>> & ErrorLikeBody;
  try {
    body = (await resp.json()) as Partial<Envelope<T>> & ErrorLikeBody;
  } catch {
    if (resp.status === 401) {
      await onAuthFailure?.();
      throw new NoveraAuthError(RECONNECT_MESSAGE);
    }
    throw new NoveraApiError(`Request failed (HTTP ${resp.status})`, resp.status);
  }
  if (isAuthFailure(resp.status, body)) {
    await onAuthFailure?.();
    throw new NoveraAuthError(body.message || RECONNECT_MESSAGE);
  }
  if (!resp.ok || body.code !== 0) {
    throw new NoveraApiError(
      body.message || `Request failed (HTTP ${resp.status})`,
      resp.status,
      typeof body.code === "number" ? body.code : undefined,
    );
  }
  return body.data as T;
}

export interface RequestInitLike {
  body?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
}

export async function request<T>(
  ctx: RequestContext,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  init?: RequestInitLike,
): Promise<T> {
  const token = await ctx.getToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...init?.headers,
  };
  let body: string | undefined;
  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const resp = await fetch(buildUrl(ctx.apiBase, path, init?.params), {
    method,
    headers,
    body,
  });
  return unwrap<T>(resp, ctx.onAuthFailure);
}
