# Permission Cleanup Analysis

## Problem

The controlled device login requested exactly:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The MSAL device-login result reported additional scopes. The stored MSAL access-token metadata also contains a broader scope target. The response included the expected scopes and additional permissions, including `Mail.Send`, `MailboxSettings.ReadWrite`, `Calendars.ReadWrite`, `Contacts.ReadWrite`, `Files.ReadWrite`, `Notes.*`, `Tasks.*` and `User.ReadWrite`.

## Difference

Expected:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

Unexpected Graph scopes reported by the MSAL login result:

- `Mail.Send`
- `MailboxSettings.ReadWrite`
- `Calendars.ReadWrite`
- `Contacts.ReadWrite`
- `Files.ReadWrite`
- `Notes.Create`
- `Notes.Read`
- `Notes.ReadWrite`
- `Tasks.ReadWrite`
- `User.ReadWrite`

`Mail.Read` was also present as a pre-existing/read scope. `openid` and `profile` are sign-in scopes rather than Microsoft Graph permissions.

## Scope Source Findings

### Requested scope construction

`src/auth.ts` derives the tool permissions from the selected tools and appends only explicit extra scopes in `resolveAuthScopes()`. `src/cli.ts` parses `--preset`, `--allowed-scopes` and `--extra-scopes`. The `mail-write-controlled` preset maps to the `controlled-write` endpoint allowlist. The two enabled Graph write endpoints each declare only `Mail.ReadWrite` in `src/endpoints.json`.

For the login in this phase, the logged request was exactly `Mail.ReadWrite`, `MailboxSettings.Read`, and `User.Read`. The runtime environment had no `ENABLED_TOOLS`, `MS365_MCP_EXTRA_SCOPES`, or `MS365_MCP_ALLOWED_SCOPES` override. Scope construction in the repository therefore does not account for the additional MSAL response scopes.

### Preset permission catalog

`src/endpoints.json` contains permissions for many independent product areas, including Calendar, Files, Contacts, Notes, Tasks and mail send/settings operations. `resolveAuthScopes()` filters those endpoint declarations by the enabled tool pattern; merely declaring a scope in the catalog does not add it to the selected login request. The effective `--list-permissions` output for the controlled preset is only `Mail.ReadWrite` (plus the explicitly passed `MailboxSettings.Read` and `User.Read` as extras when calculating the login request).

### Application registration and previous consent

The runtime used the built-in public client ID and the `consumers` tenant. The repository contains no Azure App Registration manifest or tenant consent-grant record, so its delegated permission configuration cannot be established from local source. The strongest local explanation is that this client/account has a broader existing consent grant and/or cached access-token entry. This is consistent with the broad scopes returned by MSAL despite the narrow request, but does not prove whether each grant originated from earlier consent or a configuration in the remote app registration.

### Token cache

`--diagnose-auth` found an account and a readable encrypted cache. Its access-token `target` metadata included the broader scope list. The cached credential did not expose a locally decodable JWT `scp` claim, so cache target metadata must not be presented as proof of actual grant. The actual MSAL login result scopes are recorded in `docs/PERMISSION_ACTIVATION_FAILURE.md`.

The new `--diagnose-permissions` command reports `scopeSource: msal-cache-target`, `grantVerified: false`, no missing expected scopes, and the unexpected Graph scopes listed above. It therefore detects the broad token metadata without claiming that this cache target alone proves granted consent.

### Client and tenant consistency

The same configured runtime client and tenant are used by login and the later local verification. The current tenant is `consumers`; `verify-login` succeeded for the cached account. No evidence of a login/verification client mismatch was found. No Azure configuration was inspected or changed.

## `--diagnose-permissions`

Run with the controlled preset:

```powershell
node dist/index.js --preset mail-write-controlled --extra-scopes "MailboxSettings.Read User.Read" --diagnose-permissions
```

The command reports:

- expected scopes for this permission transition;
- token scopes from a decoded JWT `scp` claim when available, otherwise scope metadata from MSAL's cached access-token `target`;
- scope source and whether the grant itself was verified;
- missing expected scopes and unexpected Graph scopes;
- sign-in-only scopes and the pre-existing `Mail.Read` baseline separately.

The report never prints access tokens, refresh tokens or secrets. If only `target` metadata is available, the output explicitly marks the comparison as metadata-only. The command reads local cache data and does not call Graph.

## Current Safety State

- `WRITE_EXECUTION_ENABLED=false` by default and explicitly false for the controlled device login.
- `WRITE_ADAPTER_MODE=mock` by default and explicitly `mock` for the controlled device login.
- Consent was not revoked; no permissions or scopes were changed in this phase.
- Mailbox unchanged; no Graph Write API was called; no folders created and no messages moved.
- Phase 1.3.9 remains **Permission Activation Pending**.
