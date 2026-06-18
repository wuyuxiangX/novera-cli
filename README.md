# Novera developer toolkit

One core, three shells — the open-source way to use [Novera](https://novera.ink)
from the terminal, from scripts, and from AI clients.

| Package                              | npm                  | What it is                                                |
| ------------------------------------ | -------------------- | --------------------------------------------------------- |
| [`@novera/sdk`](packages/core)       | `@novera/sdk`        | API client + auth (PAT and OAuth login). The shared core. |
| [`novera`](packages/cli)             | `novera`             | The CLI: `npx novera search "rust"`.                      |
| [`@novera/mcp-server`](packages/mcp) | `@novera/mcp-server` | MCP server for Claude Desktop, Cursor, etc.               |
| [`skill/novera-save`](skill/novera-save) · [`skill/novera-search`](skill/novera-search) | — | Two focused Claude Code skills (save into / find in Novera) that drive the CLI. |

## Quick start

```bash
# Interactive: log in through the browser, then search.
npx novera login
npx novera search "design systems"

# Headless / CI / scripts: use a Personal Access Token.
export NOVERA_API_KEY=opk_xxx
npx novera items list --json
```

### MCP (Claude Desktop / Cursor)

```json
{
  "mcpServers": {
    "novera": {
      "command": "npx",
      "args": ["-y", "@novera/mcp-server"],
      "env": { "NOVERA_API_KEY": "opk_xxx" }
    }
  }
}
```

## Authentication

Two credential sources, resolved in this order:

1. **`NOVERA_API_KEY`** — a Personal Access Token (`opk_…`) from the webapp
   (Settings → Developer → API keys). Used by the MCP server, CI, and any
   headless usage. Never written to disk.
2. **`novera login`** — OAuth 2.0 Authorization Code + PKCE through the browser.
   The CLI binds a loopback port, opens the consent page, and stores the
   resulting token in the OS keychain (falling back to `~/.novera/credentials.json`).

Environments: `--env production|development|local` or `NOVERA_ENV`.

## Development

```bash
pnpm install
pnpm build         # build all packages (turbo)
pnpm test          # vitest
pnpm typecheck
pnpm lint
pnpm gen:types     # regenerate OpenAPI types into @novera/sdk
```

This is a pnpm + turbo monorepo. `@novera/sdk` has no dependency on the CLI or
MCP packages; both depend on it. Releases are managed with
[changesets](https://github.com/changesets/changesets).

## License

MIT
