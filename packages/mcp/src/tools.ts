/** Tool registration for the Novera MCP server. Scenario-aggregated (~8 tools)
 *  rather than one-per-endpoint, which keeps tool selection accurate. */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NoveraClient } from "@novera/sdk";
import { z } from "zod";

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerTools(server: McpServer, client: NoveraClient): void {
  server.tool(
    "novera_search",
    "Hybrid search over the user's saved Novera items. Best entry point for finding saved content.",
    {
      query: z.string().describe("natural-language or keyword query"),
      limit: z.number().int().min(1).max(50).optional(),
      source: z.string().optional().describe("filter by source, e.g. xhs, twitter"),
    },
    async ({ query, limit, source }) => json(await client.search({ q: query, limit, source })),
  );

  server.tool(
    "novera_get_item",
    "Fetch a single saved item by id, with full content and metadata.",
    { id: z.string() },
    async ({ id }) => json(await client.items.get(id)),
  );

  server.tool(
    "novera_list_items",
    "List saved items (most recent first), optionally filtered by source.",
    {
      source: z.string().optional(),
      page: z.number().int().min(1).optional(),
      pageSize: z.number().int().min(1).max(100).optional(),
    },
    async ({ source, page, pageSize }) => json(await client.items.list({ source, page, pageSize })),
  );

  server.tool(
    "novera_capture_item",
    "Save a URL to Novera. Returns the captured item (or the existing one if already saved).",
    { url: z.string().url(), title: z.string().optional() },
    async ({ url, title }) => json(await client.items.create({ url, title })),
  );

  server.tool(
    "novera_update_item",
    "Update a saved item: favorite/unfavorite, archive/restore, or set its note.",
    {
      id: z.string(),
      action: z.enum(["favorite", "unfavorite", "archive", "restore", "note"]),
      note: z
        .string()
        .optional()
        .describe("required when action is 'note' — replaces the description"),
    },
    async ({ id, action, note }) => {
      switch (action) {
        case "favorite":
          return json(await client.items.favorite(id));
        case "unfavorite":
          return json(await client.items.unfavorite(id));
        case "archive":
          return json(await client.items.archive(id));
        case "restore":
          return json(await client.items.restore(id));
        case "note":
          return json(await client.items.note(id, note ?? "", "replace"));
      }
    },
  );

  server.tool(
    "novera_delete_item",
    "Delete a saved item by id (soft delete).",
    { id: z.string() },
    async ({ id }) => json(await client.items.delete(id)),
  );

  server.tool(
    "novera_list_folders",
    "List the user's folders and smart collections for organizing items.",
    {},
    async () =>
      json({
        folders: await client.folders.list(),
        smartCollections: await client.collections.list(),
      }),
  );

  server.tool(
    "novera_organize",
    "Assign or unassign items to/from folders.",
    {
      action: z.enum(["assign", "unassign"]),
      itemIds: z.array(z.string()).min(1),
      folderIds: z.array(z.string()).min(1),
    },
    async ({ action, itemIds, folderIds }) =>
      json(
        action === "assign"
          ? await client.folders.assign(itemIds, folderIds)
          : await client.folders.unassign(itemIds, folderIds),
      ),
  );
}
