import { Command } from "commander";

import { run } from "./context.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { searchCommand } from "./commands/search.js";
import {
  itemsCreateCommand,
  itemsDeleteCommand,
  itemsGetCommand,
  itemsListCommand,
} from "./commands/items.js";
import { collectionsListCommand, foldersListCommand } from "./commands/folders.js";

const program = new Command();

program
  .name("nv")
  .description("Command-line toolkit for Novera — search, capture, and organize saved content")
  .version("0.1.0")
  .option("--json", "output raw JSON (for scripts and the Novera skill)")
  .option("--env <env>", "target environment: production | development | local");

program
  .command("login")
  .description("Sign in via the browser (OAuth PKCE) and store the credential")
  .action((_opts, cmd) => run(() => loginCommand(cmd.optsWithGlobals())));

program
  .command("logout")
  .description("Remove the stored credential for the current environment")
  .action((_opts, cmd) => run(() => logoutCommand(cmd.optsWithGlobals())));

program
  .command("whoami")
  .description("Show the authenticated user")
  .action((_opts, cmd) => run(() => whoamiCommand(cmd.optsWithGlobals())));

program
  .command("search")
  .description("Hybrid search over saved items")
  .argument("<query>", "search query")
  .option("--limit <n>", "max results")
  .option("--source <source>", "filter by source (e.g. xhs, twitter)")
  .action((query, _opts, cmd) => run(() => searchCommand(query, cmd.optsWithGlobals())));

const items = program.command("items").description("Work with saved items");

items
  .command("list")
  .description("List saved items")
  .option("--source <source>", "filter by source")
  .option("--page <n>", "page number")
  .option("--page-size <n>", "items per page")
  .action((_opts, cmd) => run(() => itemsListCommand(cmd.optsWithGlobals())));

items
  .command("get")
  .description("Show one item")
  .argument("<id>", "item id")
  .action((id, _opts, cmd) => run(() => itemsGetCommand(id, cmd.optsWithGlobals())));

items
  .command("create")
  .description("Capture a URL")
  .argument("<url>", "URL to save")
  .option("--title <title>", "optional title")
  .action((url, _opts, cmd) => run(() => itemsCreateCommand(url, cmd.optsWithGlobals())));

items
  .command("delete")
  .description("Delete an item")
  .argument("<id>", "item id")
  .action((id, _opts, cmd) => run(() => itemsDeleteCommand(id, cmd.optsWithGlobals())));

const folders = program.command("folders").description("Work with folders");
folders
  .command("list")
  .description("List folders")
  .action((_opts, cmd) => run(() => foldersListCommand(cmd.optsWithGlobals())));

const collections = program.command("collections").description("Work with smart collections");
collections
  .command("list")
  .description("List smart collections")
  .action((_opts, cmd) => run(() => collectionsListCommand(cmd.optsWithGlobals())));

program.parseAsync();
