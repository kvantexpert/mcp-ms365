# Permission Activation Result

## Status

**Pending**

The device-login command reported success, but the subsequent validation could not find a valid token in the configured cache. The granted scopes therefore could not be independently confirmed.

## Previous permissions

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

## Result permissions

**Not verified.** The requested target set was:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

No unrelated permission was requested by the narrow `mail-write-controlled` login invocation. The actual scopes in a valid access token remain unverified.

## Authentication

- Device login: the login process reported success.
- Consent: completion is not independently verifiable because no valid token was available afterward.

## Validation

- `node dist/index.js --preset mail-write-controlled --extra-scopes "MailboxSettings.Read User.Read" --verify-login`: **failed**, `No valid token found`.
- `node dist/index.js --preset mail-write-controlled --extra-scopes "MailboxSettings.Read User.Read" --list-permissions`: reported the preset's required tool permission as `Mail.ReadWrite`. This command reports configured/tool-required permissions and does not prove which scopes Microsoft granted to an access token.

The activation is **Pending** until a valid token is available and its granted scopes can be verified. Expected delegated scopes are exactly `Mail.ReadWrite`, `MailboxSettings.Read`, and `User.Read`; Calendar, Files, Teams, Contacts, and other Graph permissions are not in scope.

## Safety State

- `WRITE_EXECUTION_ENABLED=false` (default; no enabling override was applied).
- `WRITE_ADAPTER_MODE=mock` (default; no adapter change was applied).
- Mailbox unchanged.
- No Graph write API was called.
- No folders were created and no messages were moved.
