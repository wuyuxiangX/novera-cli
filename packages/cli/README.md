# novera

Command-line toolkit for [Novera](https://novera.ink) — search, capture, and
organize your saved content.

```bash
npx novera login                     # browser OAuth (PKCE)
npx novera search "rust async"       # hybrid search
npx novera items list --json         # recent items as JSON
npx novera items create "https://…"  # capture a URL
npx novera folders list
```

Headless usage: set `NOVERA_API_KEY=opk_…` (a Personal Access Token) and skip
`login`. See the [monorepo README](../../README.md) for details.
