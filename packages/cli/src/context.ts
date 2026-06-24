/** Shared command helpers: client construction and uniform error exit. */

import { createClient, type NoveraClient } from "novera-sdk";
import pc from "picocolors";

export interface GlobalOptions {
  env?: string;
  json?: boolean;
}

export function getClient(opts: GlobalOptions): Promise<NoveraClient> {
  return createClient({ env: opts.env });
}

/** Print an error to stderr and exit non-zero. */
export function fail(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(pc.red("✗ ") + message + "\n");
  process.exit(1);
}

/** Wrap an async command body so any throw becomes a clean non-zero exit. */
export function run(body: () => Promise<void>): void {
  body().catch(fail);
}
