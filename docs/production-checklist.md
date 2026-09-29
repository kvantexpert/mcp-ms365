# Production checklist

Use this checklist before releasing the SSH stdio deployment:

```text
Codex
  |
  | SSH stdio
  v
ms-365-mcp-server
  |
  v
Microsoft Graph
```

The intended MCP profile is `--preset mail-readonly`.

## 1. Repository

- [ ] The checkout is on the intended release branch.
- [ ] The latest commit is the approved release commit.
- [ ] `git status` is clean.
- [ ] The production build completed successfully for this commit.

Record the branch and commit used for the release. Do not treat a successful build from a different commit as evidence for the release candidate.

## 2. MCP profile

- [ ] The server is launched with `--preset mail-readonly`.
- [ ] The resolved profile has `readOnly=true`.
- [ ] The resolved profile has `disableAuthTools=true`.

Check the preset list and resolved permissions using the installed Node entrypoint:

```sh
node <path>/dist/index.js --list-presets
node <path>/dist/index.js --preset mail-readonly --list-permissions
```

Run these commands with the same environment and command-line options as the MCP process. Expected tool-derived permissions:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

## 3. Tools audit

Inspect `tools/list` from the connected MCP client using the production profile.

- [ ] `login` is absent.
- [ ] `logout` is absent.
- [ ] `verify-login` is absent.
- [ ] `list-accounts` is absent.
- [ ] `select-account` is absent.
- [ ] `remove-account` is absent.
- [ ] Graph write tools are absent, including send, create, update, move, and delete operations.
- [ ] The remaining Graph tools match the intended mail read use case.

Check `download-bytes-to-file` separately. It reads bytes from Microsoft Graph, but writes a file to the server's local filesystem as the MCP process user. The profile is Graph read-only, not free of local filesystem writes. Restrict its use or exclude it from the tool allowlist if local file creation is not acceptable.

## 4. Authentication

- [ ] A token cache for the intended Microsoft account exists before the MCP process starts.
- [ ] The MCP operating-system account can read and update the cache; other users cannot access it.
- [ ] The cache encryption key is available through the configured credential store or protected file storage.
- [ ] Selected-account metadata is configured and accessible to the MCP process.
- [ ] Microsoft login was completed in advance for that operating-system account; MCP auth tools are not used for login in this profile.

Review the configured paths without printing token contents:

```text
MS365_MCP_TOKEN_CACHE_PATH=<cache-path>
MS365_MCP_SELECTED_ACCOUNT_PATH=<selected-account-path>
```

If either variable is unset, verify the application's per-user default path for the account that runs MCP. Do not assume selected-account metadata follows a custom token-cache path.

## 5. Environment audit

Inspect the environment actually used by the MCP process. Do not print secret values while doing so.

- [ ] `ENABLED_TOOLS` is unset, so it cannot override the preset allowlist.
- [ ] `MS365_MCP_EXTRA_SCOPES` is unset, so it cannot add Graph permissions.
- [ ] `MS365_MCP_ORG_MODE` is unset unless organization/work mode is explicitly required and reviewed.
- [ ] The permissions check in section 2 ran with this same environment.

## 6. Network

- [ ] HTTP MCP mode is off; the server has no HTTP MCP listener.
- [ ] No Caddy route exposes the MCP server.
- [ ] Codex connects to MCP only through SSH stdio.
- [ ] SSH access is limited to trusted users and the required remote account; privileged access is narrowly controlled.
- [ ] The SSH stdio session does not allocate a pseudo-terminal and MCP protocol data remains on stdout.

## 7. Backup

- [ ] The token cache is included in an encrypted, access-controlled backup.
- [ ] The encryption key is backed up securely. If it is file-based, back up the corresponding key together with the cache.
- [ ] Selected-account metadata is backed up if the same account selection must be restored.
- [ ] A restore procedure is documented and has been tested without exposing token contents.

A cache backup without its encryption key may not be restorable. Protect backups at least as carefully as the live authentication files.

## 8. Final acceptance

- [ ] Build OK for the release commit.
- [ ] Tests OK for the release commit.
- [ ] Permissions OK: only `Mail.Read`, `MailboxSettings.Read`, and `User.Read`.
- [ ] `tools/list` reviewed against the intended mail read surface.
- [ ] Auth tools absent.
- [ ] Graph write tools absent.
- [ ] SSH stdio connection works.
- [ ] HTTP MCP endpoint is off.
