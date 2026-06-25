/**
 * Persistence for OAuth credentials.
 *
 * Primary: the OS keychain via `@napi-rs/keyring` (an optional native module
 * with prebuilt binaries — the maintained successor to the archived `keytar`).
 * Fallback: `~/.novera/credentials.json` (mode 0600) when the keyring is
 * unavailable (e.g. Linux without libsecret, or CI). PATs from `NOVERA_API_KEY`
 * are never written here — headless credentials stay in the environment only.
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

type Keyring = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

/** `@napi-rs/keyring` exposes a per-entry class; `getPassword`/`deletePassword`
 *  throw when the entry is missing, so we map those to keytar-style null/false. */
type KeyringEntry = {
  getPassword(): string | null;
  setPassword(password: string): void;
  deletePassword(): boolean;
};

let keyringPromise: Promise<Keyring | null> | undefined;

async function loadKeyring(): Promise<Keyring | null> {
  if (!keyringPromise) {
    keyringPromise = import("@napi-rs/keyring")
      .then((m) => {
        const Entry = (m as { Entry: new (service: string, account: string) => KeyringEntry })
          .Entry;
        return {
          getPassword: async (service, account) => {
            try {
              return new Entry(service, account).getPassword();
            } catch {
              return null;
            }
          },
          setPassword: async (service, account, password) => {
            new Entry(service, account).setPassword(password);
          },
          deletePassword: async (service, account) => {
            try {
              return new Entry(service, account).deletePassword();
            } catch {
              return false;
            }
          },
        } satisfies Keyring;
      })
      .catch(() => null);
  }
  return keyringPromise;
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
  const keyring = await loadKeyring();
  if (keyring) {
    const raw = await keyring.getPassword(SERVICE, env);
    return raw ? (JSON.parse(raw) as StoredCredential) : null;
  }
  const all = await readFileStore();
  return all[env] ?? null;
}

export async function writeCredential(cred: StoredCredential): Promise<void> {
  const keyring = await loadKeyring();
  if (keyring) {
    await keyring.setPassword(SERVICE, cred.env, JSON.stringify(cred));
    return;
  }
  const all = await readFileStore();
  all[cred.env] = cred;
  await writeFileStore(all);
}

export async function clearCredential(env: NoveraEnvironment): Promise<void> {
  const keyring = await loadKeyring();
  if (keyring) {
    await keyring.deletePassword(SERVICE, env);
    return;
  }
  const all = await readFileStore();
  delete all[env];
  await writeFileStore(all);
}
