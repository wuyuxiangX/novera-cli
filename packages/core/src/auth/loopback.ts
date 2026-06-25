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
import { MASCOT_DATA_URI } from "./mascot.js";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/** The OAuth callback tab shown after the browser redirects back. Mirrors the
 *  Novera webapp's dark theme (near-black #111, Geist-ish system font, the cube
 *  mascot, aggressive negative letter-spacing) and stays deliberately minimal —
 *  it's a throwaway tab the user closes immediately. */
function renderPage(variant: "ok" | "err", title: string, message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Novera</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"PingFang SC",sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(130% 120% at 50% -10%,#1a1a1d 0%,#0e0e0f 58%);color:#ededed;letter-spacing:-.01em}
.card{text-align:center;padding:40px 32px;animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
.mark{position:relative;width:84px;height:84px;margin:0 auto 26px}
.mark img{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;display:block}
.mark::after{content:"";position:absolute;left:50%;bottom:-6px;width:78%;height:42%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgba(159,184,226,.30) 0%,rgba(88,112,154,.14) 46%,transparent 74%);filter:blur(4px);z-index:0}
.h{font-size:22px;font-weight:600;letter-spacing:-.025em;margin:0}
.h.err{color:#ff6369}
.p{margin:8px 0 0;font-size:14px;color:#a1a1a1;line-height:1.55}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.card{animation:none}}</style></head>
<body><main class="card">
<div class="mark"><img src="${MASCOT_DATA_URI}" alt="Novera" width="84" height="84"></div>
<h1 class="h ${variant === "err" ? "err" : ""}">${escapeHtml(title)}</h1>
<p class="p">${escapeHtml(message)}</p></main></body></html>`;
}

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
      res
        .writeHead(400, { "Content-Type": "text/html" })
        .end(
          renderPage(
            "err",
            "Sign-in was denied",
            "You can close this tab and run the command again.",
          ),
        );
      rejectCode(new NoveraAuthError(`Authorization denied: ${error}`));
      return;
    }
    if (!code || state !== expected) {
      res
        .writeHead(400, { "Content-Type": "text/html" })
        .end(
          renderPage(
            "err",
            "Sign-in couldn't be verified",
            "Something didn't match up. Close this tab and run the command again.",
          ),
        );
      rejectCode(new NoveraAuthError("Invalid OAuth callback (state mismatch or missing code)."));
      return;
    }
    res
      .writeHead(200, { "Content-Type": "text/html" })
      .end(
        renderPage(
          "ok",
          "Signed in to Novera",
          "You can close this tab and return to the terminal.",
        ),
      );
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
