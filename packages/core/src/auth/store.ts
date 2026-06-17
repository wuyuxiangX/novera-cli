/**
 * Persistence for OAuth credentials.
 *
 * Primary: the OS keychain via `keytar` (an optional native dependency).
 * Fallback: `~/.novera/credentials.json` (mode 0600) when keytar is unavailable
 * (e.g. Linux without libsecret, or CI). PATs from `NOVERA_API_KEY` are never
 * written here — headless credentials stay in the environment only.
 */

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { NoveraEnvironment } from "../config.js";

export interface StoredCredential {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds when the access token expires. */
  expiresAt: number;
  scope?: string;
  env: NoveraEnvironment;
}

const SERVICE = "novera-cli";
const FILE_PATH = join(homedir(), ".novera", "credentials.json");

type Keytar = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

let keytarPromise: Promise<Keytar | null> | undefined;

async function loadKeytar(): Promise<Keytar | null> {
  if (!keytarPromise) {
    keytarPromise = import("keytar")
      .then((m) => (m.default ?? m) as unknown as Keytar)
      .catch(() => null);
  }
  return keytarPromise;
}

async function readFileStore(): Promise<Record<string, StoredCredential>> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as Record<string, StoredCredential>;
  } catch {
    return {};
  }
}

async function writeFileStore(all: Record<string, StoredCredential>): Promise<void> {
  await fs.mkdir(dirname(FILE_PATH), { recursive: true, mode: 0o700 });
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2), { mode: 0o600 });
}

export async function readCredential(env: NoveraEnvironment): Promise<StoredCredential | null> {
  const keytar = await loadKeytar();
  if (keytar) {
    const raw = await keytar.getPassword(SERVICE, env);
    return raw ? (JSON.parse(raw) as StoredCredential) : null;
  }
  const all = await readFileStore();
  return all[env] ?? null;
}

export async function writeCredential(cred: StoredCredential): Promise<void> {
  const keytar = await loadKeytar();
  if (keytar) {
    await keytar.setPassword(SERVICE, cred.env, JSON.stringify(cred));
    return;
  }
  const all = await readFileStore();
  all[cred.env] = cred;
  await writeFileStore(all);
}

export async function clearCredential(env: NoveraEnvironment): Promise<void> {
  const keytar = await loadKeytar();
  if (keytar) {
    await keytar.deletePassword(SERVICE, env);
    return;
  }
  const all = await readFileStore();
  delete all[env];
  await writeFileStore(all);
}
