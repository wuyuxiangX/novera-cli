/** Rendering helpers — human-readable tables by default, raw JSON with --json. */

import Table from "cli-table3";
import pc from "picocolors";
import type { Item, Folder, SmartCollection, UserInfo } from "@novera/sdk";

export interface OutputOptions {
  json?: boolean;
}

export function emit(value: unknown, options: OutputOptions, render: () => void): void {
  if (options.json) {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  } else {
    render();
  }
}

export function success(message: string): void {
  process.stderr.write(pc.green("✓ ") + message + "\n");
}

export function info(message: string): void {
  process.stderr.write(pc.dim(message) + "\n");
}

function truncate(value: string | null | undefined, max: number): string {
  if (!value) return pc.dim("—");
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

export function renderItems(items: Item[]): void {
  if (items.length === 0) {
    info("No items.");
    return;
  }
  const table = new Table({
    head: [pc.bold("ID"), pc.bold("Source"), pc.bold("Title"), pc.bold("URL")],
    style: { head: [], border: [] },
    colWidths: [14, 12, 40, 36],
    wordWrap: true,
  });
  for (const item of items) {
    table.push([
      pc.dim(item.id.slice(0, 8)),
      item.source,
      truncate(item.title ?? item.description, 38),
      truncate(item.url, 34),
    ]);
  }
  process.stdout.write(table.toString() + "\n");
}

export function renderItemDetail(item: Item): void {
  const lines = [
    `${pc.bold("ID")}        ${item.id}`,
    `${pc.bold("Source")}    ${item.source}`,
    `${pc.bold("Title")}     ${item.title ?? pc.dim("—")}`,
    `${pc.bold("URL")}       ${item.url}`,
    `${pc.bold("Status")}    ${item.status}${item.isFavorite ? pc.yellow("  ★ favorite") : ""}`,
    `${pc.bold("Captured")}  ${item.capturedAt}`,
  ];
  if (item.description) lines.push(`\n${item.description}`);
  process.stdout.write(lines.join("\n") + "\n");
}

export function renderFolders(folders: Folder[]): void {
  if (folders.length === 0) {
    info("No folders.");
    return;
  }
  const table = new Table({
    head: [pc.bold("ID"), pc.bold("Name"), pc.bold("Depth")],
    style: { head: [], border: [] },
  });
  for (const f of folders) {
    table.push([pc.dim(f.id.slice(0, 8)), f.name, String(f.depth)]);
  }
  process.stdout.write(table.toString() + "\n");
}

export function renderCollections(collections: SmartCollection[]): void {
  if (collections.length === 0) {
    info("No smart collections.");
    return;
  }
  const table = new Table({
    head: [pc.bold("ID"), pc.bold("Name")],
    style: { head: [], border: [] },
  });
  for (const c of collections) {
    table.push([pc.dim(c.id.slice(0, 8)), c.name]);
  }
  process.stdout.write(table.toString() + "\n");
}

export function renderUser(user: UserInfo): void {
  process.stdout.write(
    [
      `${pc.bold("User")}      ${user.username ?? user.nickname ?? user.sub}`,
      `${pc.bold("Email")}     ${user.email ?? pc.dim("—")}`,
      `${pc.bold("Subject")}   ${user.sub}`,
    ].join("\n") + "\n",
  );
}
