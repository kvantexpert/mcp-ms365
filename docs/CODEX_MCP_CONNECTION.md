# Codex MCP Connection

## Architecture

Codex starts the local stdio MCP server from the built project entrypoint. The
server loads the existing MSAL account cache, obtains a Graph token silently,
and makes delegated Microsoft Graph requests for mailbox reads.

```text
Codex
  -> stdio MCP server (node dist/index.js --preset mail-readonly --disable-auth-tools)
  -> MSAL cached account and token
  -> Microsoft Graph API
  -> Outlook mailbox
```

OAuth login and token verification were completed before this connection check.
Normal MCP calls do not start an interactive login flow.

## Codex configuration

The user-level configuration is `C:\Users\admin\.codex\config.toml`. The
`ms365` server entry is:

```toml
[mcp_servers.ms365]
command = "node"
args = [
  'D:\Documents\GitHub\mcp-ms365\dist\index.js',
  '--preset',
  'mail-readonly',
  '--disable-auth-tools',
]
startup_timeout_sec = 120
```

The command uses the built entrypoint and the `mail-readonly` preset. It does
not use the broader `mail` preset or enable Graph write operations.

## Verified MCP tools

Codex loaded these requested mail tools from `ms365`:

- `list-mail-folders`
- `list-mail-messages`
- `get-mail-message`
- `list-mail-attachments`
- `get-mailbox-settings`

The MCP server also exposes other read-only mail utilities covered by the
preset. Authentication and account-management tools are disabled. No Graph
write tools were enabled in the verified tool list.

## End-to-end checks

On 2026-09-30, an ephemeral Codex CLI session loaded the configured `ms365`
server and called it through MCP:

- `list-mail-folders {}` succeeded with HTTP 200 and returned 8 Outlook
  folders.
- `list-mail-messages { "top": 5 }` succeeded with HTTP 200 and returned 5
  real mailbox messages.

These calls establish the chain from Codex through the local stdio server and
MSAL token cache to Microsoft Graph and the mailbox. Mailbox content, subjects,
addresses, and message identifiers are intentionally omitted from this report.

## Microsoft Graph scopes

The verified `mail-readonly` profile requests these delegated permissions:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

No additional Graph scopes were configured for Codex.

## Read-only limits

- The `mail-readonly` preset exposes read-only Graph tools and excludes Graph
  write operations such as sending, creating, updating, moving, or deleting
  mail.
- `--disable-auth-tools` hides MCP login, logout, and account-management
  operations. It does not disable the already configured local token cache.
- `download-bytes-to-file` is a local file-writing utility even though its
  Graph operation is a read. It was not used in these checks.
- The test called only `list-mail-folders` and `list-mail-messages` with a
  maximum of five messages. No message was sent, changed, or deleted.
