# @novera/mcp-server

[Model Context Protocol](https://modelcontextprotocol.io) server for
[Novera](https://novera.ink). Lets AI clients (Claude Desktop, Cursor, …) search
and manage your saved content.

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

Auth is PAT-only (`NOVERA_API_KEY`, an `opk_…` token). Tools: `novera_search`,
`novera_get_item`, `novera_list_items`, `novera_capture_item`,
`novera_update_item`, `novera_delete_item`, `novera_list_folders`,
`novera_organize`.
