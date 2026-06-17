import type { GlobalOptions } from "../context.js";
import { getClient } from "../context.js";
import { emit, info, renderItemDetail, renderItems, success } from "../output.js";

export interface ListOptions extends GlobalOptions {
  source?: string;
  page?: string;
  pageSize?: string;
}

export async function itemsListCommand(opts: ListOptions): Promise<void> {
  const client = await getClient(opts);
  const data = await client.items.list({
    source: opts.source,
    page: opts.page ? Number(opts.page) : undefined,
    pageSize: opts.pageSize ? Number(opts.pageSize) : undefined,
  });
  emit(data, opts, () => {
    renderItems(data.items);
    info(`page ${data.page} · ${data.items.length} of ${data.total}`);
  });
}

export async function itemsGetCommand(id: string, opts: GlobalOptions): Promise<void> {
  const client = await getClient(opts);
  const item = await client.items.get(id);
  emit(item, opts, () => renderItemDetail(item));
}

export interface CreateOptions extends GlobalOptions {
  title?: string;
}

export async function itemsCreateCommand(url: string, opts: CreateOptions): Promise<void> {
  const client = await getClient(opts);
  const result = await client.items.create({ url, title: opts.title });
  emit(result, opts, () => {
    renderItemDetail(result.item);
    success(result.duplicate ? "Already saved (returned existing item)." : "Captured.");
  });
}

export async function itemsDeleteCommand(id: string, opts: GlobalOptions): Promise<void> {
  const client = await getClient(opts);
  await client.items.delete(id);
  emit({ id, deleted: true }, opts, () => success(`Deleted ${id}.`));
}
