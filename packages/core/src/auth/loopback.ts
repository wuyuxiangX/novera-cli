/**
 * Loopback redirect server for the CLI OAuth flow (RFC 8252 §7.3).
 *
 * Binds 127.0.0.1 on an ephemeral port and waits for the browser to redirect
 * back with `?code=…&state=…`. The backend matches loopback redirects ignoring
 * the port, so any free port works.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo, Socket } from "node:net";

import { NoveraAuthError } from "../errors.js";

const SUCCESS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Novera</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#0b0b0c;color:#e7e7ea}
.card{text-align:center}.h{font-size:20px;font-weight:600}.p{margin-top:8px;color:#9a9aa2}</style></head>
<body><div class="card"><div class="h">✓ Signed in to Novera</div><div class="p">You can close this tab and return to the terminal.</div></div></body></html>`;

export interface LoopbackServer {
  /** Loopback redirect URI to hand to the authorize request. */
  redirectUri: string;
  /** Resolve with the authorization code once the browser redirects back. */
  waitForCallback(expectedState: string): Promise<string>;
  close(): void;
}

export async function startLoopbackServer(path = "/callback"): Promise<LoopbackServer> {
  let resolveCode: (code: string) => void;
  let rejectCode: (err: Error) => void;
  const codePromise = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });
  let expected: string | undefined;

  const server: Server = createServer((req, res) => {
    // Close the browser's connection after each response so no keep-alive
    // socket lingers and keeps the Node process alive after login completes.
    res.setHeader("Connection", "close");
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== path) {
      res.writeHead(404).end();
      return;
    }
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (error) {
      res.writeHead(400, { "Content-Type": "text/plain" }).end(`Authorization failed: ${error}`);
      rejectCode(new NoveraAuthError(`Authorization denied: ${error}`));
      return;
    }
    if (!code || state !== expected) {
      res.writeHead(400, { "Content-Type": "text/plain" }).end("Invalid callback.");
      rejectCode(new NoveraAuthError("Invalid OAuth callback (state mismatch or missing code)."));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" }).end(SUCCESS_HTML);
    resolveCode(code);
  });

  // Track open sockets so close() can destroy any that are still lingering
  // (e.g. the browser's). Otherwise the process won't exit on its own.
  const sockets = new Set<Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const port = (server.address() as AddressInfo).port;

  return {
    redirectUri: `http://127.0.0.1:${port}${path}`,
    waitForCallback(expectedState: string): Promise<string> {
      expected = expectedState;
      return codePromise;
    },
    close(): void {
      for (const socket of sockets) socket.destroy();
      server.close();
    },
  };
}
