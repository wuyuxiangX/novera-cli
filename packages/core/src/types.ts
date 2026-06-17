/** Wire shapes mirroring the Novera API (camelCase DTOs, {code,message,data}).
 *
 * Hand-written core DTOs ported from the Raycast extension. Once `gen:types`
 * runs, `src/generated/schema.d.ts` can back-fill the long tail; these stay as
 * the stable, friendly surface the CLI/MCP render against.
 */

export interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface Author {
  name: string;
  id?: string | null;
  avatar?: string | null;
  url?: string | null;
}

export interface ItemStats {
  likes?: number;
  collects?: number;
  comments?: number;
  views?: number;
  shares?: number;
}

export interface Item {
  id: string;
  source: string;
  sourceItemId: string;
  url: string;
  type: string;
  status: string;
  isFavorite: boolean;
  title: string | null;
  description: string | null;
  bodyText: string | null;
  coverUrl: string | null;
  images: string[];
  videoUrl: string | null;
  author: Author;
  stats: ItemStats;
  metadata: Record<string, unknown>;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** BookmarkSearchResponse. `total` is the current slice length, not the full
 *  cardinality — paginate by "items.length < limit means done". */
export interface SearchData {
  items: Item[];
  total: number;
  queryRewritten?: string | null;
  latencyMs?: number;
  searchLogId?: string | null;
}

/** PaginatedResponse<ItemResponse> (folder items, /items list). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Folder {
  id: string;
  userId?: string;
  parentId: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  sortOrder: string;
  depth: number;
}

export interface SmartCollection {
  id: string;
  name: string;
  icon: string | null;
  color?: string | null;
  filterSpec?: Record<string, unknown> | null;
}

export interface Tag {
  key: string;
  name: string;
  color?: string | null;
  count?: number;
}

export interface UserInfo {
  sub: string;
  email?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

/** POST /items body. Only `url` is required. */
export interface CreateItemBody {
  url: string;
  title?: string;
  description?: string;
  isFavorite?: boolean;
}

/** CreateItemResponse — the persisted (or deduped) item. */
export interface CreateItemResult {
  item: Item;
  duplicate: boolean;
}

export type NoteMode = "replace" | "append";

/** GET /items query params (server supports source + pagination only). */
export interface ListItemsParams {
  source?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
  source?: string;
}

export interface FolderListResponse {
  folders: Folder[];
}

export interface SmartCollectionListResponse {
  smartCollections: SmartCollection[];
}

export interface TagListResponse {
  tags: Tag[];
}
