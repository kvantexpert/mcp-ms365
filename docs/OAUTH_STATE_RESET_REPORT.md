# OAuth State Reset Report

## Purpose

Prepare a clean local OAuth state before a future, separately initiated Microsoft consent flow. This report records a read-only storage inventory and the guarded cleanup procedure. The actual cleanup was not executed.

## Checkpoint

Current base commit: `186b962` (`docs: prepare oauth consent reset procedure`).

Checkpoint tag: `mail-assistant-before-oauth-consent-reset-v1`.

## Storage Analysis

Inventory was collected with `node dist/index.js --clear-auth-cache --dry-run`. No cache contents or credential values were printed.

### MSAL Cache

Status: **missing at configured file path**.

Backend: default encrypted file + OS credential store. The configured token-cache file slot contains 0 files. `MS365_MCP_TOKEN_CACHE_PATH` was not configured.

### OS Credential Storage

Status: **unknown / unavailable for inspection**.

The optional `keytar` module is installed, but the credential-store query failed in this runtime. Token-cache, selected-account, and encryption-key credential counts are unknown; no values were printed or changed.

### Custom Storage

Status: **missing / not configured**.

`MS365_MCP_AUTH_CACHE_COMMAND` was not configured. Custom token-cache and selected-account path overrides were not configured.

### Selected Account Storage

Status: **missing at configured file path**.

The default selected-account file slot contains 0 files. The OS credential-store count remains unknown.

### Cache Encryption Key

The default `.cache-key` file was absent. Its OS credential-store entry, if any, was not inspectable. Cleanup preserves the encryption key.

## Current Problem

Earlier permission diagnostics reported broad MSAL scope metadata even though the controlled login requested `Mail.ReadWrite`, `MailboxSettings.Read`, and `User.Read`. Cache target metadata does not by itself prove the permissions granted by Microsoft. A local cache reset does not revoke existing Microsoft consent.

## Reset Plan

The new command previews by default:

```powershell
node dist/index.js --clear-auth-cache --dry-run
```

An explicit `--confirm` is required to clear only the `token-cache` and `selected-account` entries in the default local file/keychain storage. The cache encryption key is preserved. Cleanup is blocked if a custom storage command is configured or the OS credential store cannot be inspected. The command does not call Graph.

The confirmed command was **not** run. No local cache records were intentionally removed.

Do not remove:

- Microsoft consent grants;
- Azure App Registration configuration;
- mailbox data.

## Safety

- `WRITE_EXECUTION_ENABLED=false` by default.
- `WRITE_ADAPTER_MODE=mock` by default.
- Mailbox unchanged; no Graph Write API, folder creation, or message move occurred.
- Microsoft consent, Graph permissions, and scopes were not changed.
