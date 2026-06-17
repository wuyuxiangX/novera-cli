import { clearCredential, resolveConfig } from "@novera/sdk";

import type { GlobalOptions } from "../context.js";
import { success } from "../output.js";

export async function logoutCommand(opts: GlobalOptions): Promise<void> {
  const config = resolveConfig({ env: opts.env });
  await clearCredential(config.env);
  success(`Signed out of the "${config.env}" environment.`);
}
