# External Permission Source Audit

## Current Issue

The controlled login request was `Mail.ReadWrite`, `MailboxSettings.Read`, and `User.Read`, while the newly written MSAL cache metadata also listed broader mail, calendar, contacts, files, notes, tasks, and user scopes. The metadata is a cache target and does not prove that the permissions were granted in the access token.

## Application Configuration

- Client ID: `084a3e9f-a9f4-43f7-89f9-d229cf97853e` (built-in public client ID for the global cloud; no custom client ID or Key Vault configured).
- Tenant: `consumers` (from the `MS365_MCP_TENANT_ID` environment override).
- Authority: `https://login.microsoftonline.com/consumers`.
- Cloud: `global`.
- Preset: `mail-write-controlled`.

The audit prints only the public client ID, tenant and safe configuration-source flags. It never prints client secrets, access tokens, refresh tokens, Key Vault URLs or environment values.

## Requested Scopes

Output of:

```powershell
node dist/index.js --preset mail-write-controlled --extra-scopes "MailboxSettings.Read User.Read" --audit-permission-source
```

Preset-derived scopes:

- `Mail.ReadWrite`

Effective requested scopes:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The audit found no `ENABLED_TOOLS`, `MS365_MCP_EXTRA_SCOPES`, `MS365_MCP_ALLOWED_SCOPES`, custom client ID, Key Vault, custom cache command, or custom token-cache path environment override. The two non-preset scopes were explicit command-line extras, as expected. The tenant environment override is configured; cloud type uses the global default.

## Observed Metadata

The follow-up `--diagnose-permissions` result reported:

- Source: `msal-cache-target`.
- `grantVerified`: `false`.
- Missing expected scopes: none.
- Extra metadata scopes: `Calendars.ReadWrite`, `Contacts.ReadWrite`, `Files.ReadWrite`, `Mail.Send`, `MailboxSettings.ReadWrite`, `Notes.Create`, `Notes.Read`, `Notes.ReadWrite`, `Tasks.ReadWrite`, and `User.ReadWrite`.
- Existing baseline outside the requested set: `Mail.Read`.
- OIDC scopes: `openid`, `profile`.
- Graph API calls: `0`.

The cache location is the default per-user file at `C:\Users\admin\AppData\Roaming\ms-365-mcp-server\.token-cache.json`. The earlier clean reset removed the old token/account entries; the current metadata appeared in the cache created by the later successful narrow login.

## Audit Results

### Application permissions source

Local source review found the broad permissions in the general `src/endpoints.json` catalog because the server supports other tools. The `mail-write-controlled` preset maps to the `controlled-write` tool preset, which selects only `create-mail-folder` and `move-mail-message`. Both endpoint declarations require `Mail.ReadWrite`. No selected preset endpoint contributes `Mail.Send`, calendar, contacts, files, notes, tasks, `MailboxSettings.ReadWrite`, or `User.ReadWrite`.

The runtime uses the built-in public client ID. This repository does not contain that remote Azure App Registration manifest, so its configured delegated permissions could not be inspected.

### Consent source

The local repository has no Microsoft consent-grant record. The login completed, but the cached access-token entry exposed no decoded `scp` claim (`grantedScopes: null`). Therefore this audit cannot identify whether the extra metadata originated in the public application's remote registration, an existing Microsoft consent grant, or another identity-platform behavior. No consent was revoked or initiated during this audit.

### Cache source

The extra values are present in the MSAL cache entry's `target` metadata. Since the earlier local token/account cache reset completed before the new login, stale entries from that earlier cache are not a sufficient explanation for the current observation. The cache is where the metadata was observed, not proof of the remote grant source.

### Environment source

No scope-related environment override was active. `MS365_MCP_EXTRA_SCOPES` and `MS365_MCP_ALLOWED_SCOPES` were unset; the expected extra scopes were passed explicitly on the command line. `ENABLED_TOOLS` was unset, so the selected preset determined the tool filter. `MS365_MCP_TENANT_ID=consumers` was configured but does not add Graph scopes.

### Scope construction source

The diagnostic reports this local construction chain:

1. `src/endpoints.json` declares scopes per endpoint.
2. `src/tool-categories.ts` maps `mail-write-controlled` to its selected endpoint names.
3. `buildAllowedScopeDiagnostics()` filters endpoint permissions using that enabled-tool pattern and any allowed-scope filter.
4. `resolveAuthScopes()` appends explicit extra scopes to the selected tool scopes.

The resulting requested set is exactly the reviewed three scopes. The local scope builder does not explain the broader cache metadata.

## Conclusion

**The exact external source was not found.** The audit ruled out the selected preset, local endpoint-scope resolution and scope-related environment overrides as the source. A remote application configuration or Microsoft consent/identity behavior remains possible, but the available cache metadata cannot distinguish them and is not proof of granted permissions. Phase 1.3.9.7 remains **Permission Activation Pending**; do not proceed to Section 2 or infer a clean permission activation.

## Safety

- `WRITE_EXECUTION_ENABLED=false` by default.
- `WRITE_ADAPTER_MODE=mock` by default.
- Mailbox unchanged.
- No Graph Write API call, folder creation or message move.
- No permission changes, consent revocation, new consent or cache deletion.
