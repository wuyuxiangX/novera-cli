import { loginWithBrowser, resolveConfig } from "novera-sdk";
import open from "open";

import type { GlobalOptions } from "../context.js";
import { info, success } from "../output.js";

export async function loginCommand(opts: GlobalOptions): Promise<void> {
  const config = resolveConfig({ env: opts.env });
  // Only surface the environment when it isn't the default — end users on
  // production shouldn't see developer jargon.
  const envSuffix = config.env === "production" ? "" : ` (${config.env})`;
  info(`Signing in to Novera${envSuffix}… a browser window will open.`);
  await loginWithBrowser(config, {
    openBrowser: (url) => {
      void open(url);
    },
    onAuthorizeUrl: (url) => info(`If the browser didn't open, visit:\n${url}\n`),
  });
  success(`Signed in to Novera${envSuffix}.`);
}
