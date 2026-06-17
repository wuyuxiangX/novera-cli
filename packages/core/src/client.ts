/**
 * NoveraClient — a thin, typed facade over the REST endpoints. Every method
 * unwraps the `{code,message,data}` envelope and returns `data`.
 *
 * The Novera API is action-oriented: writes are POSTs to sub-paths
 * (`/items/{id}/delete`, `/folders/assign`) rather than REST verbs.
 */

import { request, type RequestContext } from "./http.js";
import type {
  CreateItemBody,
  CreateItemResult,
  Folder,
  FolderListResponse,
  Item,
  NoteMode,
  Paginated,
  ListItemsParams,
  SearchData,
  SearchParams,
  SmartCollection,
  SmartCollectionListResponse,
  Tag,
  TagListResponse,
  UserInfo,
} from "./types.js";

export class NoveraClient {
  constructor(private readonly ctx: RequestContext) {}

  /** Current user (profile:read). */
  whoami(): Promise<UserInfo> {
    return request<UserInfo>(this.ctx, "GET", "/oauth/userinfo");
  }

  /** Hybrid search over saved items (items:read). */
  search(params: SearchParams): Promise<SearchData> {
    return request<SearchData>(this.ctx, "GET", "/items/search", {
      params: { q: params.q, limit: params.limit, offset: params.offset, source: params.source },
    });
  }

  readonly items = {
    list: (params: ListItemsParams = {}): Promise<Paginated<Item>> =>
      request<Paginated<Item>>(this.ctx, "GET", "/items", { params: { ...params } }),

    get: (id: string): Promise<Item> => request<Item>(this.ctx, "GET", `/items/${id}`),

    getByUrl: (url: string): Promise<Item> =>
      request<Item>(this.ctx, "GET", "/items/by-url", { params: { url } }),

    create: (body: CreateItemBody): Promise<CreateItemResult> =>
      request<CreateItemResult>(this.ctx, "POST", "/items", { body }),

    note: (id: string, description: string, mode: NoteMode = "replace"): Promise<Item> =>
      request<Item>(this.ctx, "POST", `/items/${id}/note`, { body: { description, mode } }),

    favorite: (id: string): Promise<Item> =>
      request<Item>(this.ctx, "POST", `/items/${id}/favorite`),

    unfavorite: (id: string): Promise<Item> =>
      request<Item>(this.ctx, "POST", `/items/${id}/unfavorite`),

    archive: (id: string): Promise<Item> => request<Item>(this.ctx, "POST", `/items/${id}/archive`),

    restore: (id: string): Promise<Item> => request<Item>(this.ctx, "POST", `/items/${id}/restore`),

    refresh: (id: string): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", `/items/${id}/refresh`),

    delete: (id: string): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", `/items/${id}/delete`),
  };

  readonly folders = {
    list: (): Promise<Folder[]> =>
      request<FolderListResponse>(this.ctx, "GET", "/folders").then((r) => r.folders),

    items: (folderId: string, page = 1, pageSize = 20): Promise<Paginated<Item>> =>
      request<Paginated<Item>>(this.ctx, "GET", `/folders/${folderId}/items`, {
        params: { page, pageSize },
      }),

    create: (name: string, parentId?: string): Promise<Folder> =>
      request<Folder>(this.ctx, "POST", "/folders", { body: { name, parentId } }),

    update: (id: string, body: { name?: string; color?: string; icon?: string }): Promise<Folder> =>
      request<Folder>(this.ctx, "POST", `/folders/${id}/update`, { body }),

    move: (id: string, parentId: string | null): Promise<Folder> =>
      request<Folder>(this.ctx, "POST", `/folders/${id}/move`, { body: { parentId } }),

    delete: (id: string): Promise<Folder> =>
      request<Folder>(this.ctx, "POST", `/folders/${id}/delete`),

    restore: (id: string): Promise<Folder> =>
      request<Folder>(this.ctx, "POST", `/folders/${id}/restore`),

    assign: (itemIds: string[], folderIds: string[]): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", "/folders/assign", { body: { itemIds, folderIds } }),

    unassign: (itemIds: string[], folderIds: string[]): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", "/folders/unassign", { body: { itemIds, folderIds } }),
  };

  readonly tags = {
    list: (): Promise<Tag[]> =>
      request<TagListResponse>(this.ctx, "GET", "/tags").then((r) => r.tags),

    create: (displayName: string): Promise<Tag> =>
      request<Tag>(this.ctx, "POST", "/tags", { body: { displayName } }),

    update: (
      key: string,
      body: { displayName?: string; addAliases?: string[]; removeAliases?: string[] },
    ): Promise<Tag> => request<Tag>(this.ctx, "POST", "/tags/update", { body: { key, ...body } }),

    merge: (sourceKey: string, targetKey: string): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", "/tags/merge", { body: { sourceKey, targetKey } }),

    delete: (key: string): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", "/tags/delete", { body: { key } }),
  };

  readonly collections = {
    list: (): Promise<SmartCollection[]> =>
      request<SmartCollectionListResponse>(this.ctx, "GET", "/smart-collections").then(
        (r) => r.smartCollections,
      ),

    get: (id: string): Promise<SmartCollection> =>
      request<SmartCollection>(this.ctx, "GET", `/smart-collections/${id}`),

    create: (
      name: string,
      filterSpec: Record<string, unknown>,
      icon = "",
    ): Promise<SmartCollection> =>
      request<SmartCollection>(this.ctx, "POST", "/smart-collections", {
        body: { name, icon, filterSpec },
      }),

    update: (
      id: string,
      body: { name?: string; icon?: string; filterSpec?: Record<string, unknown> },
    ): Promise<SmartCollection> =>
      request<SmartCollection>(this.ctx, "POST", `/smart-collections/${id}/update`, { body }),

    delete: (id: string): Promise<unknown> =>
      request<unknown>(this.ctx, "POST", `/smart-collections/${id}/delete`),
  };
}
