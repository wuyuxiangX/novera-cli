# @novera/sdk

API client and authentication for [Novera](https://novera.ink) — the shared core
behind the `novera` CLI and `@novera/mcp-server`.

```ts
import { createClient } from "@novera/sdk";

const novera = await createClient(); // PAT (NOVERA_API_KEY) or stored login
const results = await novera.search({ q: "rust" });
const item = await novera.items.get(id);
```

Handles the `{code,message,data}` envelope, OAuth PKCE login + token refresh, and
PAT credentials. See the [monorepo README](../../README.md).
