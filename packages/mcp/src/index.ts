/**
 * Novera MCP server (stdio).
 *
 * Auth is PAT-only: this is a headless process with no browser, so it reads
 * `NOVERA_API_KEY` (an `opk_…` Personal Access Token) and fails fast if absent.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "novera-sdk";

import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const apiKey = process.env.NOVERA_API_KEY?.trim();
  if (!apiKey?.startsWith("opk_")) {
    console.error(
      "novera-mcp: set NOVERA_API_KEY to a Novera Personal Access Token (opk_…). " +
        "Create one in the webapp under Settings → Developer → API keys.",
    );
    process.exit(1);
  }

  const client = await createClient({ env: process.env.NOVERA_ENV, apiKey });

  const server = new McpServer({ name: "novera", version: "0.1.0" });
  registerTools(server, client);

  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  console.error("novera-mcp fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
