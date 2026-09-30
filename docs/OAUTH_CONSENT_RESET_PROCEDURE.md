# OAuth Consent Reset Procedure

## Purpose

Prepare a clean permission activation after detecting broader scope metadata in the local MSAL cache. The local token and selected-account cache cleanup described here was executed and is recorded in `docs/OAUTH_STATE_RESET_EXECUTION_RESULT.md`. Microsoft consent was not revoked.

## Current Problem

The controlled login requested:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The existing cache metadata reports a broader scope target. That metadata is not itself proof of the permissions actually granted by Microsoft. The repository cannot determine whether the extra scopes come from a previous consent grant or remote application configuration.

## Reset Scope

If a separately approved cleanup is performed later, limit it to these local records:

- the local MSAL token cache;
- the local selected-account cache record.

Do not delete or change:

- the Azure App Registration;
- Microsoft tenant settings or consent grants;
- mailbox data;
- the local cache-encryption key (`.cache-key`).

`--clear-auth-cache` without `--confirm` runs in preview-only mode. Add `--dry-run` to state that intent explicitly. Preview reports configured local file paths and existence plus known OS credential-store record counts; it never emits stored values. It does not migrate or delete records or contact Microsoft Graph. A custom cache command or unavailable OS credential store blocks confirmed cleanup because the backend cannot be safely verified.

The successful user-context preflight found one token-cache file and one selected-account file, no matching cache records in the OS credential store, and one preserved cache-encryption-key credential. The sandboxed process had a restricted view of those locations; see the execution result for the authoritative before/after record.

## Before Reset

Pre-reset checkpoint commit: `545b4d0` (`feat: add permission cleanup analysis`).

Checkpoint tag: `mail-assistant-before-oauth-consent-reset-v1`.

The cleanup command requires the explicit `--confirm` flag to clear exactly the local token-cache and selected-account records. It preserves the cache-encryption key. `--confirm` cannot be combined with `--dry-run`. The reset was completed and verified as described in `docs/OAUTH_STATE_RESET_EXECUTION_RESULT.md`.

## After Reset

After the completed cleanup, the verified local state is:

- no cached account selection;
- no cached token entry.

The state was verified with `--diagnose-auth` and a subsequent dry-run. A local cache reset does not revoke prior remote consent, and a later login may still return permissions broader than the requested set.

## Next Step

After separate approval, perform a fresh device login requesting only:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

Before completing consent, verify the application and permissions presented by Microsoft. Stop if unrelated permissions appear. Device login and consent are outside the current preparation phase.

## Safety State

- Microsoft consent was not revoked.
- No local cache was cleared by this phase.
- Permissions and Graph scopes were not changed.
- No mailbox changes or Graph write calls were made.
- `WRITE_EXECUTION_ENABLED=false`; `WRITE_ADAPTER_MODE=mock`.
