# Production deployment: Codex over SSH stdio

This guide describes a single-user deployment of the MS365 MCP server using Codex stdio over SSH. It does not require an HTTP MCP endpoint.

## 1. Architecture overview

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

Codex starts the server as an SSH remote command and exchanges MCP messages over standard input and output. The server uses its local MSAL token cache to authenticate Graph requests.

This design does not require a public HTTP MCP endpoint, a Caddy proxy, or an OAuth redirect for the MCP client. Microsoft sign-in is performed separately for the operating-system account that runs the server. Normal MCP connections use that account's existing token cache. Restrict SSH access because anyone able to run the MCP command can use the cached Microsoft identity.

## 2. Installation

Replace the placeholders below with values for your deployment:

- **Runtime:** Node.js, available in the remote command's `PATH` (or use its absolute `<node-path>`).
- **Application:** `<path>/dist/index.js`.
- **Environment file:** `<path>/mcp.env`.
- **Run as:** `<mcp-user>`, with access to the application, environment file, and token storage.

The SSH account must be allowed to run the command as `<mcp-user>` and read the configured files. For example, if the SSH login already uses that operating-system account, the remote command can load its environment file and start the server directly:

```sh
set -a
. "<path>/mcp.env"
set +a
export MS365_MCP_TOKEN_CACHE_PATH="<cache-path>"
export MS365_MCP_SELECTED_ACCOUNT_PATH="<selected-account-path>"
exec node "<path>/dist/index.js" --preset mail-readonly
```

Treat the environment file as trusted shell input: restrict who can write it, and do not print its contents into logs, chat, or documentation.

## 3. Token cache

`MS365_MCP_TOKEN_CACHE_PATH` sets the MSAL token cache location. For example:

```text
MS365_MCP_TOKEN_CACHE_PATH=<cache-path>
```

The token cache is encrypted. When keytar is available, the encryption key is stored in the operating-system credential store. In headless environments without a usable credential store, the key is stored in `.cache-key` beside the token cache.

Selected-account metadata has its own path, configured with `MS365_MCP_SELECTED_ACCOUNT_PATH`. If that variable is unset, it uses the per-user application config directory; it does not automatically follow a custom token-cache path.

Restrict the token directory and metadata directory to the MCP operating-system account and administrators (for example, directory mode `0700`); restrict the cache, key, and metadata files (for example, file mode `0600`). Verify ownership as well as mode bits. A file-based key beside the cache does not protect against someone who can read that directory.

Back up the cache and its corresponding key together when the key is file-based. Also preserve selected-account metadata if restoring the same account selection. Encrypt backups at rest and restrict access. If the key is in an OS credential store, arrange a secure backup and recovery process for that store; copying only the cache file is insufficient. Test restoration in a controlled environment without exposing token contents.

## 4. Running profile and authentication

Start the MCP server through its Node entrypoint:

```sh
node <path>/dist/index.js --preset mail-readonly
```

The `mail-readonly` preset is equivalent to:

```text
--preset mail --read-only --disable-auth-tools
```

It selects the mail tool preset, enables read-only filtering, and disables MCP login and account-management tools. Disabling auth tools only hides those MCP tools; it does not perform or replace Microsoft sign-in. A valid token cache for the intended account must exist before normal MCP use.

The tool-derived Microsoft Graph permissions are:

```text
Mail.Read
MailboxSettings.Read
User.Read
```

`ENABLED_TOOLS` overrides the preset's tool allowlist. `MS365_MCP_EXTRA_SCOPES` appends permissions independently of the preset. `MS365_MCP_ORG_MODE` changes the server's organization/work mode. Review these values in the environment actually used to launch MCP. `--allowed-scopes` can narrow tool-derived permissions; it does not cancel extra scopes.

## 5. Codex configuration

Add an entry like this to `~/.codex/config.toml`, replacing placeholders with your SSH alias and remote paths. Keep secrets out of the Codex configuration.

```toml
[mcp_servers.ms365]
command = "ssh"
args = [
  "-T",
  "<ssh-host>",
  "bash -lc 'set -a; . \"<path>/mcp.env\"; set +a; export MS365_MCP_TOKEN_CACHE_PATH=\"<cache-path>\"; export MS365_MCP_SELECTED_ACCOUNT_PATH=\"<selected-account-path>\"; exec node \"<path>/dist/index.js\" --preset mail-readonly'"
]
```

The `-T` option disables pseudo-terminal allocation, which is important for a clean stdio protocol stream. Keep MCP protocol output on stdout; diagnostic logging belongs on stderr. Replace every placeholder with the corresponding path or SSH alias from your deployment.

## 6. Security checklist

- [ ] SSH access is limited to trusted users and protected with an approved key or equivalent SSH control.
- [ ] The SSH host and remote operating-system account are the intended ones; privilege escalation is narrowly restricted.
- [ ] The environment file is readable by the intended process and writable only by administrators; its values are never printed.
- [ ] Token cache, encryption key, and selected-account metadata have restrictive ownership and permissions.
- [ ] No HTTP MCP listener is running; the server is launched only as an SSH stdio subprocess.
- [ ] No reverse-proxy route exposes this MCP server.
- [ ] `ENABLED_TOOLS` is unset so it cannot replace the preset allowlist.
- [ ] `MS365_MCP_EXTRA_SCOPES` is unset so no additional Graph permissions are requested.
- [ ] `MS365_MCP_ORG_MODE` is unset unless organization/work mode is explicitly intended.
- [ ] Run `--list-permissions` with the same environment and command-line options used by the MCP process. Confirm the result contains only `Mail.Read`, `MailboxSettings.Read`, and `User.Read`.
- [ ] Codex reports the server as stdio over SSH, and `tools/list` contains only the expected mail read tools and utilities.

To check permissions with the deployment environment, use the same environment-loading steps and Node entrypoint as the MCP command, adding `--list-permissions` and omitting the normal server start. Do not print environment-file contents while doing so.

## 7. Limitations

`mail-readonly` prevents Graph write tools from being registered and limits tool-derived Graph permissions. It does not mean that the MCP process has no local side effects.

In particular, `download-bytes-to-file` reads bytes from Microsoft Graph and writes them to a path on the server filesystem as the process user. This is **Graph read-only plus local filesystem write**. Protect SSH/MCP access and the account's filesystem permissions accordingly. If local file creation is not acceptable, use a reviewed tool allowlist that excludes this utility rather than assuming `--read-only` disables filesystem writes.
