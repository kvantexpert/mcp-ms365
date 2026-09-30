# Permission Activation Final Result

## Status

**Failed validation — Phase 1.3.9.7 remains Pending; Phase 1.3.9 remains Permission Activation Pending.**

Device login and Graph `/me` verification succeeded, but the permission acceptance criteria were not met. Cached scope metadata contains permissions outside the approved set, and the diagnostic could not verify an access-token `scp` claim. Do not treat this session as a clean minimal-permission activation.

## Requested scopes

The device login was started with the controlled mail preset and only these explicit scopes:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

The controlled preset contributes `Mail.ReadWrite`; `MailboxSettings.Read` and `User.Read` were explicitly appended. No extra-scope or allowed-scope environment override was set.

## Verified result

The login command completed successfully for `admin@kvantexpert.ru`. The application requested the reviewed three-scope set. The subsequent MSAL cache report listed additional permissions in cached token `target` metadata. That metadata is not proof that every listed permission was granted, but it fails the requested clean-cache acceptance check and prevents claiming a minimal verified permission result.

## Diagnostics

### `diagnose-auth`

- Status: `account-found`.
- Cache file: exists, readable, parseable.
- Account count: `1`.
- Selected identity: `admin@kvantexpert.ru`.
- Cached token: present and not expired at diagnostic time.
- `grantedScopes`: `null`; no decoded `scp` claim was available.
- Cached requested-scope metadata included the expected scopes plus `Calendars.ReadWrite`, `Contacts.ReadWrite`, `Files.ReadWrite`, `Mail.Read`, `Mail.Send`, `MailboxSettings.ReadWrite`, `Notes.Create`, `Notes.Read`, `Notes.ReadWrite`, `Tasks.ReadWrite`, and `User.ReadWrite`.
- Graph API calls by this diagnostic: `0`.

### `verify-login`

- Result: **success** (`Login successful`).
- The check validated Graph `/me`; it did not call a Graph write endpoint.

### `diagnose-permissions`

- Expected: `Mail.ReadWrite`, `MailboxSettings.Read`, `User.Read`.
- Missing: none.
- Extra: `Calendars.ReadWrite`, `Contacts.ReadWrite`, `Files.ReadWrite`, `Mail.Send`, `MailboxSettings.ReadWrite`, `Notes.Create`, `Notes.Read`, `Notes.ReadWrite`, `Tasks.ReadWrite`, `User.ReadWrite`.
- Existing baseline: `Mail.Read`.
- OIDC scopes: `openid`, `profile`.
- Scope source: `msal-cache-target`.
- `grantVerified`: `false`.
- Graph API calls: `0`.

## Cause and disposition

The narrow request did not produce a cache report that satisfies the minimal-scope check. In addition to the ten `extra` scopes, the `Mail.Read` scope is listed as an existing baseline even though it was not part of the requested set; the strict expected set therefore is not met. The available diagnostic reports MSAL cache request metadata rather than a verified grant, so the exact source of the scopes is not established. The permission cleanup analysis found that this repository cannot inspect the remote app registration or Microsoft consent grants. Do not expand local scopes, change the Azure application, or infer consent state from this metadata. Phase 1.3.9.7 remains Pending for further permission investigation.

## Security

- `WRITE_EXECUTION_ENABLED=false` for the login process.
- `WRITE_ADAPTER_MODE=mock` for the login process.
- Mailbox unchanged.
- Graph Write API not called.
- No folders created and no messages moved.
- No permissions or Graph scopes were changed in source configuration.
