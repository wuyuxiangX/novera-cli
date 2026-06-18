---
name: novera-search
description: Find or browse content the user previously saved in Novera — their personal "save it for later" library. Use when the user wants to search/recall/look up something they bookmarked, list recent saves, or see their Novera folders and smart collections. NOT for general web search — only searches the user's own saved Novera items.
allowed-tools:
  - Bash(npx novera whoami)
  - Bash(npx novera search:*)
  - Bash(npx novera items list:*)
  - Bash(npx novera items get:*)
  - Bash(npx novera folders list:*)
  - Bash(npx novera collections list:*)
---

# Search & browse Novera

Find things in the user's own saved library. This never searches the open web —
only what the user has saved to Novera.

## When this applies

- "What did I save about X?", "find that article I bookmarked", "show my recent
  saves", "what's in my Novera folders".
- **Not** this skill: general web/research questions — those aren't about the
  user's saved items.

## Prerequisite — auth

```bash
npx novera whoami --json
```

If this fails with `Not authenticated…`, tell the user to set `NOVERA_API_KEY`
(a Personal Access Token, `opk_…`, from the webapp → Settings → Developer → API
keys). Never ask them to paste the token into the chat.

## Find

Always pass `--json`, then summarize for the user.

```bash
npx novera search "<query>" --json            # hybrid search — best entry point
npx novera search "<query>" --source xhs --json
npx novera items list --json                  # most recent saves
npx novera items get <item-id> --json         # one item in full
```

## Browse the organization

```bash
npx novera folders list --json
npx novera collections list --json
```

## Interpreting output

Each item has `id`, `source`, `title`, `url`, `description`, `isFavorite`,
`status`, `capturedAt`. Prefer `title`, then `description`, then `url` when
describing an item. For search, `total` is the size of the returned slice — if
`items.length === limit` there are more results.

See `references/search.md`, `references/organize.md`, and
`references/api-cheatsheet.md` for details.
