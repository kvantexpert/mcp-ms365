# OAuth Token Diagnostic

## Problem

Device login reported completion, but a later `--verify-login` returned `No valid token found`. A successful Graph `/me` check inside the login process can use that process's in-memory access token; a separate process must also be able to read a cached account and silently acquire a token.

The local diagnostic found no account and no readable token cache at the configured cache path. It also showed the current runtime tenant as `consumers`. In addition, the login persistence guard had a gap: when MSAL exposed no refresh-token entries through its in-memory cache API, the guard returned early and allowed the in-process access token to make login appear successful without confirming a saved refresh token. The guard now checks persisted storage in that case and fails the login if no new refresh token was saved.

Observed on 2026-09-30: `--diagnose-auth` reported `status: no-account`, no cache file at the configured path, no readable cache, zero accounts and zero cached access tokens. The same-scope `--verify-login` still reports `No valid token found`. The diagnostic command itself does not make Graph requests.

## Expected scopes

The controlled mail permission transition expects:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The diagnostic separates requested scopes (`target`) from granted scopes (`scp` decoded locally from a cached access-token JWT), if present. It never prints the JWT. It does not request consent and cannot report scopes represented only by refresh tokens.

## Checks

Run from the repository/runtime configured for the MCP server:

```powershell
node dist/index.js --preset mail-write-controlled --extra-scopes "MailboxSettings.Read User.Read" --diagnose-auth
```

The output includes:

- configured client ID and tenant ID, to compare with the sign-in application;
- token-cache path, backend description, file presence and readability;
- cached account identities and selected account;
- cached access-token expiry, requested scopes and actual granted scopes, when available.

The report never includes access tokens, refresh tokens, client secrets or serialized cache contents. `--diagnose-auth` reads local MSAL state only and does not call Microsoft Graph. `--verify-login` separately checks Graph `/me` using an existing token.

`--diagnose-auth` itself performs no Graph requests. Login and `--verify-login` may call Graph `/me` for connection validation; they do not call Graph write endpoints.

## Possible causes

Compare the login and verification process configuration for:

1. Different client ID or tenant ID.
2. Different `MS365_MCP_TOKEN_CACHE_PATH`, `MS365_MCP_SELECTED_ACCOUNT_PATH`, config directory, or credential-store backend.
3. A cache file that is absent, unreadable, or cannot be decrypted with its cache key.
4. No account in the loaded MSAL cache, even if the login process temporarily had an in-memory token.
5. Cached access-token expiry. An expired access token can still be refreshed if a usable account and refresh token are cached.

## Safety

- No mailbox changes.
- No Graph write calls.
- No access or refresh token values are printed.
- The diagnostic does not change OAuth permissions or scopes.
- `WRITE_EXECUTION_ENABLED` remains false by default and `WRITE_ADAPTER_MODE` remains `mock` by default.
