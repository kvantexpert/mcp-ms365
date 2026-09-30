# Permission Activation Failure

## Status

**Failed validation — Phase 1.3.9 remains Permission Activation Pending.**

The device login and `/me` check succeeded, but the scopes returned by MSAL included permissions outside the approved target set. Do not treat this session as an approved minimal-scope activation.

## Requested scopes

The device login was started with exactly:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The resolved application scope request was independently checked and contained only those three scopes.

## Authentication and validation

- Device login: **success**.
- MSAL login-process `/me` check: **success**.
- `--verify-login` in a separate process: **success** (`Login successful`).
- `--diagnose-auth`: account found; encrypted cache file exists and is readable; one account found. No token value was printed.
- MSAL `Granted scopes` response included:
  - Expected: `Mail.ReadWrite`, `MailboxSettings.Read`, `User.Read`.
  - Unexpected Graph scopes: `Mail.Read`, `Mail.Send`, `MailboxSettings.ReadWrite`, `Calendars.ReadWrite`, `Contacts.ReadWrite`, `Files.ReadWrite`, `Notes.Create`, `Notes.Read`, `Notes.ReadWrite`, `Tasks.ReadWrite`, `User.ReadWrite`.
  - `openid` and `profile` were also returned as sign-in scopes.
- `--list-permissions`: reports `Mail.ReadWrite` as the controlled preset's tool-derived requirement only. It does not report or prove the scopes granted to the access token.

The login request was narrow, but the token response was broader. The current evidence does not establish whether the additional Graph scopes came from existing consent or from the sign-in consent transaction; either way, the session does not meet the minimal-scope acceptance criteria. No further consent or scope changes were attempted.

## Safety State

- `WRITE_EXECUTION_ENABLED=false` (explicitly set for device login; default remains false).
- `WRITE_ADAPTER_MODE=mock` (explicitly set for device login; default remains mock).
- No Graph Write API was called.
- Mailbox unchanged; no folders created and no messages moved.
- Roadmap status remains **Permission Activation Pending**.
