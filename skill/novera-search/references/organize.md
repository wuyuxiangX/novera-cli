---
name: organize
description: How Novera organizes items — folders, tags, smart collections — and how to inspect them.
---

# How Novera is organized

Novera has three organizing primitives. This skill can **list** them (read-only);
mutating them is left to the full CLI.

## Folders

Manual, hierarchical containers. An item can live in multiple folders.

```bash
npx novera folders list --json
```

Each folder has `id`, `name`, `parentId` (null at the root), and `depth`. Build
the tree from `parentId` if you need to show hierarchy.

## Smart collections

Saved filters that resolve to items dynamically (e.g. "everything from xhs",
"favorites this week"). They are not manual containers — membership is computed.

```bash
npx novera collections list --json
```

Each has `id`, `name`, `icon`, and an opaque `filterSpec`.

## Tags

Lightweight labels on items. Items carry `tags` (display names) and `tagKeys`
(normalized). Tag keys can contain `/` and other characters, which is why the
API addresses tags by key in the request body rather than the URL.

## Inspecting an item's placement

`npx novera items get <id> --json` returns the item with its `tags`. Folder
membership is not embedded on the item; list a folder's contents from the full
CLI if you need to confirm placement.
