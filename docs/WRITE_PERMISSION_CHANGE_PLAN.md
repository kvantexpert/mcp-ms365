# Write Permission Change Plan

This is a preparation plan only. It does not change permissions, OAuth configuration, tokens, or mailbox state, and does not authorize Microsoft consent or Graph write calls.

## Current State

Current Microsoft Graph permissions:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

Mode: **READ ONLY**.

### Where scopes and presets are defined

- `src/endpoints.json` declares each Graph endpoint's `presets` membership and required `scopes`. Mail folder creation and message move endpoints declare `Mail.ReadWrite`; mail read endpoints declare `Mail.Read`.
- `src/tool-categories.ts` defines preset behavior. `mail-readonly` maps to the `mail` endpoint membership and sets `readOnly: true` and `disableAuthTools: true`.
- `src/cli.ts` parses `--preset`, `--allowed-scopes`, and `--extra-scopes` options. `--extra-scopes` appends scopes to the token request and is not needed for a normal endpoint-derived permission plan.
- `src/auth.ts` derives requested login scopes from enabled endpoint tools and their scope metadata.

The `mail-readonly` preset is a read-only tool/runtime mode, not a separately declared Graph permission set. Its read-only setting prevents write endpoints from being used in that mode. Simply requesting `Mail.ReadWrite` while retaining this preset would not make the proposed write scenario executable. Conversely, switching to the broad `mail` preset would expose additional mail operations; it must not be treated as an acceptable shortcut for a narrowly scoped first-write mode. Any future implementation must separately constrain enabled tools to the approved folder-create and single-message-move operations.

## Target State

For the proposed controlled test, retain the existing read permissions and add only the reviewed delegated permission:

- `Mail.ReadWrite`

This is a proposed target only. It is not currently requested, granted, or enabled.

## Reason

The proposed test has two write operations:

- create the `MCP-Test` mail folder;
- move one explicitly selected message from `Inbox` into that folder.

The current `Mail.Read` permission is read-only and cannot authorize either mailbox change. The `Mail.ReadWrite` permission is the proposed minimum Graph permission for this test.

## Scope Limitation

After a separately approved future change, the intended allowed operation set is limited to:

- create the `MCP-Test` folder, after confirming that a folder with that name does not already exist;
- move one selected message, after one explicit confirmation of the exact source and destination.

Do not enable:

- Teams;
- Calendar;
- Files;
- Contacts;
- automatic rules;
- sending, deleting, bulk sorting, or bulk moving mail;
- any unrelated Graph scopes.

Because the existing `mail` preset includes broader mail functionality, implementation must use a narrowly reviewed tool allowlist or equivalent guard. Adding a permission alone is not sufficient to enforce this operation limit.

## Consent Validation

Before any future consent is completed, inspect Microsoft's consent screen and verify that it contains only the expected permissions for the approved app and scenario. In particular, confirm the proposed `Mail.ReadWrite` permission and the already reviewed required scopes; stop if unrelated permissions appear. Consent requires separate explicit approval and is outside this plan's current stage.

## Test Scenario

Only after separate approval, implementation, tests, and a checkpoint, the bounded test would be:

1. Run `verify-login` and confirm the signed-in identity.
2. List granted permissions and verify the expected permission set.
3. Confirm `MCP-Test` does not already exist, then create it.
4. Move exactly one explicitly selected message from `Inbox` to `MCP-Test`.
5. Verify the result using Graph read operations and record the audit result.

The existing execution engine is SAFE MODE: it blocks execution and has no Graph client dependency. It only prepares `move-message` proposals and does not implement folder creation. Both limitations must be addressed in a separately reviewed implementation; this plan does not alter the engine.

## Rollback

If an explicitly approved future test fails:

- remove newly issued OAuth token-cache entries for this app/account using the documented cache procedure, without deleting unrelated account credentials;
- restore the read-only configuration and tool allowlist;
- use the prior checkpoint if needed;
- verify mailbox state with read operations and, only under a separately approved rollback action, restore the one test message and remove the test-created folder if it is empty.

Do not treat rollback steps as permission to execute them now. Verify each step and retain the audit information, including source folder and the destination message ID returned by the move operation.
