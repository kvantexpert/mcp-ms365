# Authentication Login Procedure

## CLI commands

Run the commands from the repository root after dependencies are installed and the project is built. The profile is included on both commands so the login requests the least-privileged scopes for the `mail-readonly` tool set.

```powershell
node dist/index.js --preset mail-readonly --login
```

The CLI flag for login is `--login`. Device-code flow is the default for stdio. The preset sets the mail tool filter, `readOnly=true`, and `disableAuthTools=true`; hiding MCP auth tools does not disable the CLI login command.

If the package is installed and its executable is on `PATH`, the equivalent command is:

```powershell
ms-365-mcp-server --preset mail-readonly --login
```

## Required environment variables

No custom client ID or client secret is required for the built-in public client. The following settings are optional unless the deployment needs a particular tenant or cloud:

- `MS365_MCP_TENANT_ID`: defaults to `common`. For a personal Microsoft account, the project README recommends `consumers`; set it before login and keep it the same for later verification/runtime.
- `MS365_MCP_CLIENT_ID`: optional custom app registration. Without it, the built-in client ID for the selected cloud is used.
- `MS365_MCP_CLIENT_SECRET`: only for a custom app configuration that requires a secret; it is not needed for device-code login with the built-in public client. Never put it in a shared command or report.
- `MS365_MCP_CLOUD_TYPE`: optional cloud selector; defaults to `global`.

Token storage can be customized with `MS365_MCP_TOKEN_CACHE_PATH` and `MS365_MCP_SELECTED_ACCOUNT_PATH`. Optional storage controls are `MS365_MCP_USE_KEYTAR`, `MS365_MCP_AUTH_CACHE_COMMAND`, and `MS365_MCP_AUTH_CACHE_COMMAND_TIMEOUT_MS`. Use the same values for login and the MCP process.

The project `.env` loader accepts only `MS365_MCP_CLIENT_ID`, `MS365_MCP_CLIENT_SECRET`, `MS365_MCP_TENANT_ID`, and `MS365_MCP_CLOUD_TYPE`. Cache paths and storage controls must be set in the process environment (for example, the launching shell or MCP client configuration), not only in `.env`.

For the `mail-readonly` preset, `--list-permissions` should report exactly:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

## Token cache location

On Windows, the default per-user directory is `%APPDATA%\ms-365-mcp-server` (falling back to `%USERPROFILE%\AppData\Roaming\ms-365-mcp-server`). The files are:

- `.token-cache.json`: encrypted MSAL token cache;
- `.selected-account.json`: selected-account metadata, stored separately from the token cache;
- `.cache-key`: encryption key file when an OS credential store is unavailable or disabled. When keytar is available and enabled, the encryption key is held in the OS credential store instead.

The process creates parent directories as needed. Keep the cache and its encryption key protected and available to the same Windows user that runs the MCP process. Do not print cache contents, copy them into chat, or commit them. If using custom paths, set them consistently before both login and MCP startup.

## Login flow

1. Open PowerShell in the repository root. Ensure the intended `MS365_MCP_TENANT_ID`, custom client/cloud settings, and cache path environment variables are already set for that process. For a personal Microsoft account, use `MS365_MCP_TENANT_ID=consumers`.
2. Run:

   ```powershell
   node dist/index.js --preset mail-readonly --login
   ```

3. Follow the device-code instructions printed by the CLI and complete sign-in as the account owner. The CLI requests the scopes resolved for `mail-readonly`, exchanges the device code through MSAL, and persists the token cache. If no account is selected yet, the successful login also writes selected-account metadata.
4. After acquiring the token, `--login` automatically runs the login test, which performs a read-only `GET /v1.0/me`. Its JSON result can include display name and user principal name; keep it private and share only the success status.
5. Wait for the CLI to report completion. Do not copy a device code, token, or account details into a public log or report.

`--auth-browser` is an alternative explicit browser-based flow for stdio. Do not add it unless browser sign-in is desired; it replaces device-code flow rather than changing the Graph permissions.

## Verification command

The exact CLI flag is `--verify-login`. Use the same profile and environment as the login:

```powershell
node dist/index.js --preset mail-readonly --verify-login
```

This command does not start the MCP server. It attempts silent token acquisition from the cache and, if successful, performs a read-only `GET /v1.0/me`. The result includes limited profile fields; keep the output private and share only the success/failure status.

After verification, test mailbox access by starting the stdio MCP with `--preset mail-readonly` and calling `list-mail-folders`. That tool performs a read-only Graph GET. Do not use send, create, update, delete, move, or other write tools for this check.

## Troubleshooting

- **`No accounts found. Please login first.`** No account is present in the MSAL cache loaded by this process. Run the login command with the intended Windows user and the same environment/cache paths as MCP.
- **`Login failed: No valid token found`.** Check that the token cache is present and readable for this user, and that login and verification use the same client ID, tenant, cloud, and cache settings. Complete login if there is no usable cached account/token.
- **Personal-account refresh failure / `invalid_grant`.** Confirm `MS365_MCP_TENANT_ID=consumers` is set for both login and runtime, then perform a new login. Do not delete a cache as a first diagnostic step.
- **Graph 401.** Token was obtained but Graph rejected it; check token freshness, tenant/client consistency, and whether required consent was granted. Never paste the token into logs or a support request.
- **Graph 403.** Authentication reached Graph, but the requested operation is not authorized. Confirm the granted scopes and that the request is read-only and covered by them. `mail-readonly` should request `Mail.Read`, `MailboxSettings.Read`, and `User.Read`.
- **Verification succeeds but MCP cannot see the account.** Compare the exact runtime identity and environment: MCP must run as the same Windows user and use the same cache path, selected-account path, client, tenant, and cloud settings used for login.
