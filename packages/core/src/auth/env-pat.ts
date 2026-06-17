/** A static token source backed by a Personal Access Token in the environment.
 *  Used by the MCP server and any headless/CI usage. No refresh, no storage. */

import { NoveraAuthError } from "../errors.js";
import type { TokenSource } from "./token-source.js";

export class EnvPatTokenSource implements TokenSource {
  constructor(private readonly token: string) {}

  async getToken(): Promise<string> {
    return this.token;
  }
}

/** Build an EnvPatTokenSource from `NOVERA_API_KEY`, or null if unset.
 *  Throws if the value is present but malformed. */
export function patFromEnv(
  value: string | undefined = process.env.NOVERA_API_KEY,
): EnvPatTokenSource | null {
  if (!value) return null;
  const token = value.trim();
  if (!token.startsWith("opk_")) {
    throw new NoveraAuthError(
      "NOVERA_API_KEY must be a Personal Access Token starting with `opk_`.",
    );
  }
  return new EnvPatTokenSource(token);
}
