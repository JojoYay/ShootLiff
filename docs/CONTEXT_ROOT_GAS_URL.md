# Context root and GAS server URL

## Overview

ShootLiff can connect to different GAS (Google Apps Script) backends depending on the URL path. The first path segment is the **context root**. Context roots are **not hardcoded**: they are defined only by configuration, so you can add or change them without code changes.

- `https://aaaa.com/bvs/calendar` → context root `bvs` → URL from `NEXT_PUBLIC_CONTEXT_ROOT_URLS`
- `https://aaaa.com/shoot/calendar` → context root `shoot` → URL from same config
- `https://aaaa.com/cs/calendar` → context root `cs` → URL from same config
- `https://aaaa.com/calendar` (no prefix) → uses default `NEXT_PUBLIC_SERVER_URL`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SERVER_URL` | Default GAS URL (used when no context root or when the root is not in the map) |
| `NEXT_PUBLIC_CONTEXT_ROOT_URLS` | JSON string: object mapping context root name (lowercase) to GAS URL. Example: `{"bvs":"https://script.google.com/...","shoot":"https://...","cs":"https://..."}` |

Adding or renaming a context is done by editing this JSON (e.g. add a new key); no code change is required.

## Firebase config (setEnv.js)

Any Firebase `project_config` key with the **prefix** `server_url_` (and not exactly `server_url`) is collected into `NEXT_PUBLIC_CONTEXT_ROOT_URLS`:

- `server_url` → default → `NEXT_PUBLIC_SERVER_URL`
- `server_url_bvs` → context `bvs`
- `server_url_shoot` → context `shoot`
- `server_url_<any_name>` → context `<any_name>`

So you can add `server_url_newcontext` in Firebase and it will be picked up automatically.

## Config JSON (config.*.json)

You can override or set the map with a **contextRootUrls** object (camelCase):

```json
{
  "contextRootUrls": {
    "bvs": "https://script.google.com/macros/s/.../exec",
    "shoot": "https://script.google.com/macros/s/.../exec",
    "cs": "https://script.google.com/macros/s/.../exec"
  }
}
```

Add or change keys here without touching the code.

## Routes

- Root routes (e.g. `/calendar`, `/events`) use the default server URL.
- Context routes (e.g. `/bvs/calendar`, `/shoot/calendar`, `/cs/calendar`) use the URL for that context root from `NEXT_PUBLIC_CONTEXT_ROOT_URLS`.
