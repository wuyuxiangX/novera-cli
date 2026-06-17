import type { GlobalOptions } from "../context.js";
import { getClient } from "../context.js";
import { emit, renderCollections, renderFolders } from "../output.js";

export async function foldersListCommand(opts: GlobalOptions): Promise<void> {
  const client = await getClient(opts);
  const folders = await client.folders.list();
  emit(folders, opts, () => renderFolders(folders));
}

export async function collectionsListCommand(opts: GlobalOptions): Promise<void> {
  const client = await getClient(opts);
  const collections = await client.collections.list();
  emit(collections, opts, () => renderCollections(collections));
}
