import type { GlobalOptions } from "../context.js";
import { getClient } from "../context.js";
import { emit, renderUser } from "../output.js";

export async function whoamiCommand(opts: GlobalOptions): Promise<void> {
  const client = await getClient(opts);
  const user = await client.whoami();
  emit(user, opts, () => renderUser(user));
}
