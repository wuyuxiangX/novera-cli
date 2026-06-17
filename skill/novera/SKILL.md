---
name: novera
description: Search, capture, and organize content saved in Novera. Use when the user wants to find something they bookmarked/saved, save a link to Novera, list their folders or smart collections, or otherwise work with their Novera library from the terminal.
allowed-tools:
  - Bash(npx novera whoami)
  - Bash(npx novera search:*)
  - Bash(npx novera items list:*)
  - Bash(npx novera items get:*)
  - Bash(npx novera items create:*)
  - Bash(npx novera folders list:*)
  - Bash(npx novera collections list:*)
---

# Novera

Novera is a personal "save it for later" library (links, articles, social posts).
This skill drives the open-source `novera` CLI to search and manage that library.

## Prerequisites — check auth first

The CLI authenticates with a Personal Access Token in the environment. Before
doing anything else, confirm the user is connected:

```bash
npx novera whoami --json
```

- Success → a JSON object with `username` / `email`. Proceed.
- Failure (`Not authenticated…`) → tell the user to set `NOVERA_API_KEY` to a
  Novera Personal Access Token (created in the webapp under **Settings →
  Developer → API keys**, value starts with `opk_`). **Never** ask them to paste
  the token into the chat — it must live in their shell environment.

## Core tasks

Always pass `--json` so output is machine-parsable, then summarize for the user.

**Find something saved**

```bash
npx novera search "<query>" --json            # hybrid search, best entry point
npx novera search "<query>" --source xhs --json
npx novera search "<query>" --limit 20 --json
```

**Look at a specific item / recent items**

```bash
npx novera items list --json                  # most recent
npx novera items list --source twitter --json
npx novera items get <item-id> --json
```

**Save a link**

```bash
npx novera items create "<url>" --json
npx novera items create "<url>" --title "<title>" --json
```

**See how the library is organized**

```bash
npx novera folders list --json
npx novera collections list --json
```

## Interpreting output

- All commands return the raw API `data` payload as JSON when `--json` is set.
- `search` returns `{ items, total, latencyMs }`. `total` is the size of the
  returned slice, not the whole library — there are more results if
  `items.length === limit`.
- Each item has `id`, `source`, `title`, `url`, `description`, `isFavorite`,
  `status`, `capturedAt`. Prefer `title`, then `description`, then `url` when
  describing an item to the user.

## Scope & safety

This skill is read + capture only. It deliberately does **not** expose
destructive commands (delete, merge). If the user explicitly wants to delete or
reorganize, point them at the full CLI (`novera items delete`, `novera folders`)
and let them run it themselves.

For deeper task patterns see the files in `references/`.
