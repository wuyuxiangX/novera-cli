---
name: capture
description: Saving URLs into Novera — capture behavior, duplicates, titles.
---

# Capturing content

```bash
npx novera items create "<url>" --json
npx novera items create "<url>" --title "<title>" --json
```

## Behavior

- Only the URL is required. Novera fetches metadata (title, description, cover,
  author) server-side and may enrich it asynchronously, so the item returned
  immediately can be a skeleton that fills in shortly after.
- The response is `{ item, duplicate }`:
  - `duplicate: false` → newly saved.
  - `duplicate: true` → the URL was already in the library; the existing item is
    returned instead of creating a copy. Tell the user it was already saved.
- `--title` sets an explicit title up front; otherwise Novera derives one.

## Anti-bot sources

Some platforms (xiaohongshu, weibo, instagram) block server-side fetches. For
those the browser extension captures the page HTML directly. The CLI can still
save the URL, but metadata may be sparse — that's expected, not an error.

## After capturing

To file the new item into a folder, the user can use the full CLI
(`novera folders list` to find the folder id, then the folder assignment
commands). This skill's whitelist intentionally stops at capture.
