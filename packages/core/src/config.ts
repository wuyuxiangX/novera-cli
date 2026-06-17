/**
 * Novera endpoints and OAuth client configuration.
 *
 * Ported from the Raycast extension's config, with the Raycast-only bits
 * removed. The CLI/SDK/MCP toolkit targets production by default; local/dev are
 * opt-in via `NOVERA_ENV` (or explicit `createClient({ env })`).
 *
 * A public client's `client_id` is NOT a secret (PKCE public clients have no
 * secret), so it is safe to hardcode and ship in source.
 */

export type NoveraEnvironment = "production" | "development" | "local";

/** Public OAuth client backing the open-source CLI toolkit. Registered with a
 *  loopback redirect (`http://127.0.0.1/callback`, port-agnostic per RFC 8252)
 *  and the full external scope set. */
export const CLIENT_ID = "sub_cli_novera";

/** Scopes the CLI requests at login — full developer surface. */
export const SCOPE = "profile:read profile:write items:read items:write items:delete uploads:write";

const stripSlash = (s: string): string => s.replace(/\/+$/, "");

const TARGETS = {
  production: {
    webappBase: "https://novera.ink",
    apiBase: "https://api.novera.ink/api/v1",
  },
  development: {
    webappBase: "https://dev.novera.ink",
    apiBase: "https://api.dev.novera.ink/api/v1",
  },
  local: {
    webappBase: "http://localhost:18531",
    apiBase: "http://localhost:18088/api/v1",
  },
} satisfies Record<NoveraEnvironment, { webappBase: string; apiBase: string }>;

export function resolveEnvironment(raw?: string): NoveraEnvironment {
  const value = (raw ?? process.env.NOVERA_ENV)?.trim().toLowerCase();
  if (value === "local") return "local";
  if (value === "development" || value === "dev") return "development";
  return "production";
}

export interface NoveraConfig {
  env: NoveraEnvironment;
  webappBase: string;
  apiBase: string;
  clientId: string;
  scope: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
}

export interface ConfigOverrides {
  env?: NoveraEnvironment | string;
  apiBase?: string;
  webappBase?: string;
  clientId?: string;
  scope?: string;
}

/** Build the resolved config. Explicit overrides win, then env vars, then the
 *  per-environment defaults. */
export function resolveConfig(overrides: ConfigOverrides = {}): NoveraConfig {
  const env = resolveEnvironment(typeof overrides.env === "string" ? overrides.env : undefined);
  const target = TARGETS[env];
  const apiBase = stripSlash(overrides.apiBase ?? process.env.NOVERA_API_BASE ?? target.apiBase);
  const webappBase = stripSlash(
    overrides.webappBase ?? process.env.NOVERA_WEBAPP_BASE ?? target.webappBase,
  );
  const clientId = overrides.clientId ?? process.env.NOVERA_CLIENT_ID ?? CLIENT_ID;
  const scope = overrides.scope ?? SCOPE;
  return {
    env,
    webappBase,
    apiBase,
    clientId,
    scope,
    authorizeUrl: `${webappBase}/authorize`,
    tokenUrl: `${apiBase}/oauth/token`,
    userinfoUrl: `${apiBase}/oauth/userinfo`,
  };
}
