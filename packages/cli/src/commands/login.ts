import { loginWithBrowser, resolveConfig } from "@novera/sdk";
import open from "open";

import type { GlobalOptions } from "../context.js";
import { info, success } from "../output.js";

export async function loginCommand(opts: GlobalOptions): Promise<void> {
  const config = resolveConfig({ env: opts.env });
  info(`Signing in to Novera (${config.env})… a browser window will open.`);
  await loginWithBrowser(config, {
    openBrowser: (url) => {
      void open(url);
    },
    onAuthorizeUrl: (url) => info(`If the browser didn't open, visit:\n${url}\n`),
  });
  success(`Signed in. Credential stored for the "${config.env}" environment.`);
}
