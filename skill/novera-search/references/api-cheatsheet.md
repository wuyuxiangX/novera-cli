---
name: api-cheatsheet
description: CLI command ↔ Novera API endpoint mapping, the response envelope, and error codes.
---

# CLI ↔ API cheatsheet

The CLI is a thin wrapper over the Novera REST API (`/api/v1`). The API is
action-oriented — writes are POSTs to sub-paths, not REST verbs.

| CLI command                 | HTTP                                    |
| --------------------------- | --------------------------------------- |
| `novera whoami`             | `GET /oauth/userinfo`                   |
| `novera search <q>`         | `GET /items/search?q=…`                 |
| `novera items list`         | `GET /items?page=…&pageSize=…&source=…` |
| `novera items get <id>`     | `GET /items/{id}`                       |
| `novera items create <url>` | `POST /items`                           |
| `novera items delete <id>`  | `POST /items/{id}/delete`               |
| `novera folders list`       | `GET /folders`                          |
| `novera collections list`   | `GET /smart-collections`                |

## Response envelope

Every business endpoint returns:

```json
{ "code": 0, "message": "success", "data": {} }
```

- `code === 0` → success; the CLI prints `data`.
- `code !== 0` or HTTP 401 → the CLI throws and exits non-zero with the
  backend's `message`.

## Auth & error codes

- Auth header: `Authorization: Bearer <token>` where the token is either an
  OAuth access token (from `novera login`) or a PAT (`opk_…` via
  `NOVERA_API_KEY`).
- Codes `11001–11004` and HTTP `401` mean the credential is invalid/expired —
  the CLI reports "connection expired"; the user should re-run `novera login`
  or refresh `NOVERA_API_KEY`.

## Scopes

A token must carry the right scope or the API returns 403:
`profile:read`, `profile:write`, `items:read`, `items:write`, `items:delete`,
`uploads:write`. The CLI's login requests all of them; a PAT only has the scopes
it was created with.

## Environments

`--env production|development|local` (or `NOVERA_ENV`) switches targets.
Production API is `https://api.novera.ink/api/v1`.
