---
name: search
description: Searching the Novera library effectively — query phrasing, source filters, pagination.
---

# Searching Novera

`novera search` runs a hybrid search (vector + keyword + rerank) over everything
the user has saved. It is the right tool for almost any "find what I saved
about X" request.

## Query phrasing

- Use natural language or keywords; the backend rewrites and embeds the query.
- Keep it concise — a topic or phrase works better than a full sentence.
- The search covers titles, descriptions, and extracted body text.

## Filters

```bash
npx novera search "rust async" --json
npx novera search "design inspiration" --source xhs --json
npx novera search "papers" --limit 30 --json
```

- `--source <source>` narrows to one platform (e.g. `xhs`, `twitter`, `weibo`,
  `web`). Run `npx novera items list --json` and inspect `source` values to see
  what the user actually has.
- `--limit <n>` caps results (default is the server default, max 100).

## Pagination

The response `total` is the length of the returned slice, **not** the full
result count. If `items.length === limit`, there are likely more — raise
`--limit` or refine the query. There is no offset flag on the search command;
prefer a tighter query over deep paging.

## When search returns nothing

- Loosen the query (fewer/broader keywords, drop the `--source` filter).
- Fall back to `npx novera items list --json` to confirm the library is
  non-empty and see what is actually there.
