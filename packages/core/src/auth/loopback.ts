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

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const CROSS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/** Minimal, on-brand callback page shown in the browser tab after the redirect.
 *  Kept deliberately spare — it's a throwaway tab the user closes immediately. */
function renderPage(variant: "ok" | "err", title: string, message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Novera</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(120% 120% at 50% 0%,#17171b 0%,#0a0a0b 60%);color:#e9e9ec}
.card{text-align:center;padding:40px;animation:rise .45s cubic-bezier(.2,.7,.2,1) both}
.brand{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#76767e;margin-bottom:16px}
.badge{width:60px;height:60px;margin:0 auto 22px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(160deg,#2a2a31,#161619);border:1px solid rgba(255,255,255,.08);box-shadow:0 12px 34px rgba(0,0,0,.55),0 0 0 6px rgba(255,255,255,.02)}
.badge svg{width:30px;height:30px}.ok{color:#34d399}.err{color:#f87171}
.h{font-size:21px;font-weight:600;letter-spacing:-.01em}.p{margin-top:8px;font-size:14px;color:#8a8a92;line-height:1.5}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.card{animation:none}}</style></head>
<body><main class="card"><div class="brand">Novera</div>
<div class="badge ${variant}">${variant === "ok" ? CHECK_ICON : CROSS_ICON}</div>
<div class="h">${escapeHtml(title)}</div><div class="p">${escapeHtml(message)}</div></main></body></html>`;
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
