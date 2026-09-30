# OAuth State Reset Execution Result

## Status

**Completed** — local token and selected-account cache entries were cleared. Microsoft consent and Graph permissions were not changed.

## Before

Repository checkpoint: commit `b5a1f65` on `feature/mail-organization-write`; checkpoint tag `mail-assistant-before-oauth-consent-reset-v1` points to the earlier pre-reset baseline `545b4d0`.

The sandboxed dry-run initially reported the default AppData cache files missing and the OS credential store unavailable. Because that view could not inspect the credential store, the confirmed reset was blocked without deleting anything. The same guarded command was then run in the user context. Its pre-deletion inventory found:

- token-cache file: 1;
- selected-account file: 1;
- cache-encryption-key file: 0;
- OS credential-store token-cache entries: 0;
- OS credential-store selected-account entries: 0;
- OS credential-store cache-encryption-key entries: 1;
- custom storage command: not configured.

No credential values were displayed.

## Actions

The guarded `node dist/index.js --clear-auth-cache --confirm` command removed only the local token-cache file and selected-account file. It left the cache-encryption-key credential in the OS credential store. No custom storage command was configured.

The default filesystem and OS credential store were both verifiable for the successful run. Microsoft Graph was not contacted.

## After

`node dist/index.js --diagnose-auth` returned:

- `status`: `no-account`;
- token-cache file: absent and unreadable;
- account count: `0`;
- selected account: `null`;
- cached access tokens: `[]`;
- Graph API calls: `0`.

A subsequent `--clear-auth-cache --dry-run` confirmed 0 token-cache files, 0 selected-account files, 0 matching OS credential-store entries for those records, and 1 preserved cache-encryption-key credential.

## Safety

- Microsoft consent unchanged; it was not revoked.
- Permissions and Graph scopes unchanged.
- Mailbox unchanged.
- Graph Write API not called.
- No folders created and no messages moved.
- `WRITE_EXECUTION_ENABLED=false` by default; `WRITE_ADAPTER_MODE=mock` by default.
