---
name: novera-save
description: Save a link, article, or post INTO Novera — the user's personal "save it for later" library (a bookmarking service). Use when the user wants to bookmark/stash/capture a URL to Novera. NOT for saving to a local file, to disk, or to any other app — only for adding content to the Novera library.
allowed-tools:
  - Bash(npx novera whoami)
  - Bash(npx novera items create:*)
---

# Save to Novera

Add a URL to the user's Novera library. Novera then fetches the page metadata
(title, description, cover) on its own.

## When this applies

- "Save this to Novera", "bookmark this in Novera", "stash this link",
  "add this to my reading list" (when that list is Novera).
- **Not** this skill: "save this as a file", "write this to disk", "export" —
  those are local file operations, unrelated to Novera.

## Prerequisite — auth

```bash
npx novera whoami --json
```

If this fails with `Not authenticated…`, tell the user to set `NOVERA_API_KEY`
(a Personal Access Token, `opk_…`, from the webapp → Settings → Developer → API
keys). Never ask them to paste the token into the chat.

## Save

```bash
npx novera items create "<url>" --json
npx novera items create "<url>" --title "<title>" --json
```

The response is `{ item, duplicate }`:

- `duplicate: false` → newly saved.
- `duplicate: true` → already in the library; the existing item is returned.
  Tell the user it was already saved rather than implying a new copy.

Only the URL is required; Novera derives the title unless `--title` is given.
See `references/capture.md` for metadata/anti-bot-source notes.
