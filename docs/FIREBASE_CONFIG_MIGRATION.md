# Firebase functions.config() Deprecation Migration

## Summary

Firebase's `functions.config()` API and Cloud Runtime Config are deprecated. Deploys that rely on them will fail after **March 2026**. This project does **not** use `functions.config()` in code; the warning is shown by the CLI when it checks Runtime Config.

## One-time fix (recommended)

Run the export command once to migrate any existing Runtime Config to the new params/Secret Manager model. If you have no stored config, this creates an empty `.env` and clears the dependency on Runtime Config so the warning can stop appearing on deploy:

```bash
npm run firebase:config-export
# or: firebase functions:config:export
```

- When prompted, you can name the new secret e.g. `RUNTIME_CONFIG` (or skip if nothing to export).
- The CLI may create `.env` or `.env.<projectId>` in the project. Add these to `.gitignore` if they contain secrets.

## If you add Cloud Functions later

Use the **params** package instead of `functions.config()`:

```javascript
// Before (deprecated)
const apiKey = functions.config().api.key;

// After (params)
const { defineString, defineSecret } = require("firebase-functions/params");
const apiKey = defineSecret("API_KEY");
// In handler: apiKey.value()
```

- Docs: https://firebase.google.com/docs/functions/config-env#migrate-config
- For secrets: `defineSecret("NAME")` and bind with `{ secrets: [apiKey] }` in the function options.
