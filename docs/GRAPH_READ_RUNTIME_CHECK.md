# Graph Read Runtime Check

## Environment

- Date: 2026-09-29
- Branch: `feature/disable-auth-tools`
- Commit at check start: `d8e7b9a`
- Runtime: built entrypoint `dist/index.js`
- Profile: `--preset mail-readonly`
- No source code or authentication configuration was changed.
- The built-in auth environment has optional `MS365_MCP_CLIENT_ID`, `MS365_MCP_CLIENT_SECRET`, `MS365_MCP_TENANT_ID`, and `MS365_MCP_CLOUD_TYPE` values. The built-in public client ID is used when no custom client ID is configured. No secret or token values are recorded here.
- `MS365_MCP_TOKEN_CACHE_PATH` and `MS365_MCP_SELECTED_ACCOUNT_PATH` can override the cache and selected-account metadata paths. With no overrides, they use separate files under the per-user config directory. On Windows that directory is `%APPDATA%\ms-365-mcp-server` (or `%USERPROFILE%\AppData\Roaming\ms-365-mcp-server` when `APPDATA` is unavailable).
- Token storage also supports optional `MS365_MCP_USE_KEYTAR`, `MS365_MCP_AUTH_CACHE_COMMAND`, and `MS365_MCP_AUTH_CACHE_COMMAND_TIMEOUT_MS` controls. These are not required for the default MSAL file cache.
- A project `.env` is not a general environment source: the loader only accepts the four application settings above. Cache paths and storage controls must be supplied by the MCP process environment.

## Auth flow

```text
MCP stdio process
  -> AuthManager / MSAL PublicClientApplication
  -> cached account + acquireTokenSilent(requested scopes)
  -> Bearer token
  -> Microsoft Graph v1.0 GET
```

The CLI `--login` path explicitly calls MSAL device-code flow by default; browser auth is a separate explicit option. Normal MCP tool calls do not start an interactive OAuth flow. They find an account in the persisted MSAL cache and call `acquireTokenSilent`. The MSAL cache plugin loads and persists cache updates; selected-account metadata is stored separately.

Graph requests are made by `src/graph-client.ts`, which adds `Authorization: Bearer …` and uses `fetch` against the configured Graph cloud endpoint. `--verify-login` is a safe profile probe: after token acquisition it sends `GET /v1.0/me` and returns only login status and a small profile result. The mail probe `list-mail-folders` sends `GET /me/mailFolders`.

The requested source path `src/microsoft-auth.ts` does not exist in this checkout. The similarly named `src/lib/microsoft-auth.ts` implements HTTP OAuth code exchange/refresh helpers; the stdio MSAL flow is in `src/auth.ts`.

## Required scopes

`node dist/index.js --preset mail-readonly --list-permissions` completed successfully. Its effective permissions were exactly:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

The preset resolves to the mail tool set, `readOnly=true`, and `disableAuthTools=true`. `User.Read` supports the profile GET; `Mail.Read` supports the mailbox folders/messages GETs; `MailboxSettings.Read` supports mailbox settings reads. Extra scopes may be added by explicit runtime configuration, but none appeared in this `--list-permissions` result.

The MCP `tools/list` call passed and returned 17 tools. They were mail read tools and utilities (`download-bytes`, `download-bytes-to-file`); the published names included no auth/account management tools or Graph write tools. `download-bytes-to-file` can write a downloaded file locally, even though its Graph operation is read-only.

## Token acquisition result

**Failed: no usable token/account was available.** Running:

```text
node dist/index.js --preset mail-readonly --verify-login
```

returned `success=false` with `Login failed: No valid token found`. No profile data was retained in this report. Because token acquisition failed, the `/me` request in `--verify-login` was not sent.

## Graph request result

The MCP client successfully completed initialize and `tools/list`, found `list-mail-folders`, and invoked it once. The call returned:

```text
No accounts found. Please login first.
```

No Graph mailbox GET was sent: `AuthManager` stopped before MSAL could acquire a token because there was no cached account. No mailbox or profile data was retrieved. No send, create, update, delete, or other write operation was called.

## Errors

- `--verify-login`: `Login failed: No valid token found`.
- `list-mail-folders`: `No accounts found. Please login first.`
- These are local authentication-cache failures, not Microsoft Graph HTTP 401/403 responses. The run does not establish whether Microsoft would accept a token or whether the mailbox is accessible.

## Fixes

No configuration fix can be confirmed from this run. A Microsoft account must first complete the supported device-code login with the same OS user, environment, client ID/tenant settings, and cache paths that the MCP process will use. `--disable-auth-tools` only hides MCP auth tools; it does not perform or replace login.

No login was started and no token cache, selected-account metadata, environment, or configuration was changed during this check.

## Next steps

1. Have the account owner run the explicit device-code login in the intended MCP runtime environment; this is the step that will create/update the local MSAL cache and requires the owner's Microsoft sign-in.
2. Confirm login with `--verify-login`; record only the status, not returned profile fields or token values.
3. Repeat one read-only MCP `list-mail-folders` call. A successful response will confirm mailbox Graph access; record only status and item count, not folder names.
