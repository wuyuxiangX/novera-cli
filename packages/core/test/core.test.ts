import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { resolveConfig } from "../src/config.js";
import { NoveraApiError, NoveraAuthError } from "../src/errors.js";
import { buildUrl, unwrap } from "../src/http.js";
import { generatePkce, buildAuthorizeUrl } from "../src/auth/oauth-pkce.js";
import { patFromEnv } from "../src/auth/env-pat.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("buildUrl", () => {
  it("appends defined params and skips empty ones", () => {
    const url = buildUrl("https://api.test/api/v1", "/items/search", {
      q: "rust",
      limit: 5,
      source: undefined,
      empty: "",
    });
    expect(url).toBe("https://api.test/api/v1/items/search?q=rust&limit=5");
  });
});

describe("unwrap", () => {
  it("returns data on code 0", async () => {
    const data = await unwrap<{ ok: boolean }>(
      jsonResponse({ code: 0, message: "ok", data: { ok: true } }),
    );
    expect(data).toEqual({ ok: true });
  });

  it("throws NoveraApiError on business error code", async () => {
    await expect(
      unwrap(jsonResponse({ code: 40400, message: "not found" }, 200)),
    ).rejects.toBeInstanceOf(NoveraApiError);
  });

  it("throws NoveraAuthError on 401", async () => {
    await expect(unwrap(jsonResponse({ message: "unauthorized" }, 401))).rejects.toBeInstanceOf(
      NoveraAuthError,
    );
  });

  it("throws NoveraAuthError on auth error codes", async () => {
    await expect(
      unwrap(jsonResponse({ code: 11002, message: "token expired" }, 200)),
    ).rejects.toBeInstanceOf(NoveraAuthError);
  });

  it("calls onAuthFailure before throwing", async () => {
    let called = false;
    await expect(
      unwrap(jsonResponse({ code: 11001, message: "revoked" }), () => {
        called = true;
      }),
    ).rejects.toBeInstanceOf(NoveraAuthError);
    expect(called).toBe(true);
  });
});

describe("PKCE", () => {
  it("derives an S256 challenge from the verifier", () => {
    const { verifier, challenge } = generatePkce();
    const expected = createHash("sha256").update(verifier).digest().toString("base64url");
    expect(challenge).toBe(expected);
  });

  it("builds an authorize URL with required params", () => {
    const config = resolveConfig({ env: "production" });
    const url = new URL(
      buildAuthorizeUrl(config, {
        redirectUri: "http://127.0.0.1:51789/callback",
        challenge: "abc",
        state: "xyz",
      }),
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("sub_cli_novera");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:51789/callback");
  });
});

describe("patFromEnv", () => {
  it("returns null when unset", () => {
    expect(patFromEnv(undefined)).toBeNull();
  });

  it("accepts opk_ tokens", async () => {
    const src = patFromEnv("opk_abc123");
    expect(await src?.getToken()).toBe("opk_abc123");
  });

  it("rejects malformed tokens", () => {
    expect(() => patFromEnv("nope")).toThrow(NoveraAuthError);
  });
});

describe("resolveConfig", () => {
  it("maps production to the public hosts", () => {
    const config = resolveConfig({ env: "production" });
    expect(config.apiBase).toBe("https://api.novera.ink/api/v1");
    expect(config.authorizeUrl).toBe("https://novera.ink/authorize");
    expect(config.tokenUrl).toBe("https://api.novera.ink/api/v1/oauth/token");
  });
});
