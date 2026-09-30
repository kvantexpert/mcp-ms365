# OAuth Consent Reset Procedure

## Purpose

Prepare a clean permission activation after detecting broader scope metadata in the local MSAL cache. This document describes a future local cache cleanup; no cleanup or consent revocation is performed by this phase.

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

The current `--clear-auth-cache --dry-run` command only reports file paths and whether those files exist. It does not read cache contents, inspect keychain records, delete files, invoke storage deletion, or contact Microsoft Graph. Keychain-backed records are reported as not inspected.

On the preparation run, the default token-cache, selected-account, and encryption-key files were absent at their configured paths. Keychain and custom command-backed records were not inspected, so this does not establish that no cached account or token exists in other configured storage.

## Before Reset

Checkpoint commit: `545b4d0` (`feat: add permission cleanup analysis`).

Checkpoint tag: `mail-assistant-before-oauth-consent-reset-v1`.

The cleanup command must be run with `--dry-run`; without it, the command fails closed. No destructive cache reset command is implemented in this phase.

## After Reset

Only after a separately approved cleanup, the expected local state is:

- no cached account selection;
- no cached token entry.

This expected state must be verified with safe local diagnostics. A local cache reset does not revoke prior remote consent, and a later login may still return permissions broader than the requested set.

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
