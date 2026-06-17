import type { GlobalOptions } from "../context.js";
import { getClient } from "../context.js";
import { emit, info, renderItems } from "../output.js";

export interface SearchOptions extends GlobalOptions {
  limit?: string;
  source?: string;
}

export async function searchCommand(query: string, opts: SearchOptions): Promise<void> {
  const client = await getClient(opts);
  const data = await client.search({
    q: query,
    limit: opts.limit ? Number(opts.limit) : undefined,
    source: opts.source,
  });
  emit(data, opts, () => {
    renderItems(data.items);
    info(`${data.items.length} result(s)${data.latencyMs ? ` in ${data.latencyMs}ms` : ""}`);
  });
}
