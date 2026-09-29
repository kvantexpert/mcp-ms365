# MCP runtime check

## Check details

- Date: 2026-09-29
- Branch: `feature/disable-auth-tools`
- Commit at start of check: `d8e7b9a` (`docs: add mcp-ms365 operational knowledge base`)
- Transport: local MCP Inspector stdio
- Inspector version: `2.8.0`

## Commands and results

### Default Inspector command

```sh
npm run inspector
```

This starts `npx @modelcontextprotocol/inspector tsx src/index.ts`. The Inspector started at its local interface and connected to the MCP server.

- MCP `initialize`: **passed**; server reported protocol version `2025-11-25`.
- `notifications/initialized`: **sent** by Inspector.
- `tools/list`: **passed**.
- Server console: **no output**; no startup errors mentioning auth, MSAL, token cache, or cache encryption were shown.

**Important:** the package script does not select a preset. This default run therefore exposed the broad default tool set, including `login`, `logout`, `verify-login`, `list-accounts`, `select-account`, `remove-account`, and Graph write tools such as `send-mail`, `delete-mail-message`, and calendar/OneDrive write operations. Do not use the bare Inspector command as evidence that the production `mail-readonly` profile is active.

### Inspector with the intended profile

```sh
npm run inspector -- --preset mail-readonly
```

The Inspector launched `tsx src/index.ts --preset mail-readonly` and connected successfully.

- MCP `initialize`: **passed**; server reported protocol version `2025-11-25`.
- `tools/list`: **passed**. It returned the mail read surface and utility tools:
  - `get-mail-tips`
  - `list-focused-inbox-overrides`
  - `get-mailbox-settings`
  - `list-mail-folders`
  - `list-mail-child-folders`
  - `list-mail-rules`
  - `list-mail-folder-messages`
  - `list-mail-folder-messages-delta`
  - `list-mail-messages`
  - `get-mail-message`
  - `get-mail-message-mime`
  - `list-mail-attachments`
  - `list-outlook-categories`
  - `list-supported-languages`
  - `list-supported-time-zones`
  - `download-bytes`
  - `download-bytes-to-file`
- The six auth/account tools and Graph write tools listed in the default run were absent.
- Server console: **no output**; no startup auth/MSAL/token/cache error was shown.

### Permission check

```sh
node dist/index.js --preset mail-readonly --list-permissions
```

The built entrypoint returned only these effective permissions:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

## Limitations and observed issue

- No Microsoft OAuth login was started, no token contents were inspected, and no Graph tool was called. A successful initialize and tool listing do not prove that the cached account can obtain a Graph token or access mail.
- A direct diagnostic invocation through `node_modules/.bin/tsx src/index.ts --preset mail-readonly --list-permissions` failed before the app started with `uv_os_get_passwd returned ENOMEM`. Running the equivalent check through the existing built entrypoint (`node dist/index.js ...`) succeeded. The MCP Inspector's own `tsx` server process did start and complete the handshake for both runs above.
- The first initialize took about 22 seconds; the profile run also connected successfully. No cause for the startup delay was established.

## Further steps

1. Configure the Inspector or production MCP client to always pass `--preset mail-readonly`; the bare `npm run inspector` script does not do this.
2. Separately verify the intended account's cached sign-in and token refresh without printing tokens.
3. With approval for a Microsoft Graph read, call a mail listing tool to verify end-to-end Graph access. No such call was made during this runtime check.
