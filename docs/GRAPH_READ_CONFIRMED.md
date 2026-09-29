# Graph Read Runtime Confirmation

## Environment and commands

- Repository branch: `feature/disable-auth-tools`.
- MCP profile: `--preset mail-readonly` over stdio.
- Runtime commands:

  ```text
  node dist/index.js --preset mail-readonly --list-permissions
  node dist/index.js --preset mail-readonly --verify-login
  ```

- MCP Inspector was connected to the stdio server using the `mail-readonly` profile.
- No secrets, tokens, account identifiers, message contents, or mailbox data are recorded here.

## Authentication verification

`--verify-login` completed successfully. The existing Microsoft authentication was accepted, a Graph token was acquired from the configured MSAL auth flow, and the login verification's read-only `GET /v1.0/me` succeeded. Token and profile values were not recorded.

## Effective permissions

`--list-permissions` reported exactly:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

## MCP Inspector verification results

Inspector successfully initialized the MCP server, listed the tools for `mail-readonly`, and completed these read-only mailbox calls:

- `list-mail-folders`
- `list-mail-messages`
- `get-mail-message`

These successful calls confirm that Microsoft Graph mailbox reads work with the configured account and effective scopes.

## Example successful tool calls

The following tools completed successfully in Inspector; message identifiers and returned mailbox data are intentionally omitted:

```text
list-mail-folders {}
list-mail-messages {}
get-mail-message { messageId: <existing message identifier> }
```

## Security note

The `mail-readonly` preset enables read-only Graph operations and disables MCP auth/account-management tools. No Graph write operations were tested or invoked: no mail was sent, created, updated, moved, or deleted. The local-file utility `download-bytes-to-file` was not used.
