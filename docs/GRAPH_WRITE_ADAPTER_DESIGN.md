# Graph Write Adapter Design

## Current State

The runtime remains **MOCK ONLY** by default. `mail-write-adapter-factory.ts` selects the local mock Graph-shaped adapter when `WRITE_ADAPTER_MODE` is absent or set to `mock`. The `graph` mode currently selects a placeholder whose operations return `not-implemented` and `graph: false`. No Microsoft Graph client or network call is connected.

## Future State

A future implementation may replace the Graph placeholder with an adapter backed by the Microsoft Graph client. That change is outside this preparation phase and requires a separate permission transition, explicit approval, tests, and checkpoint.

## Allowed Operations

The adapter contract contains only:

- `createFolder({ parentFolderId, displayName })`;
- `moveMessage({ messageId, destinationFolderId })`.

No send, delete, rule, update, or bulk operation belongs to this adapter.

## Safety Layer

Before factory dispatch, execution validates:

1. `WRITE_ADAPTER_MODE` is an allowed mode (`mock` or `graph`);
2. `WRITE_EXECUTION_ENABLED` is exactly `true`;
3. the confirmation exists and is approved;
4. the requested operation matches the approved proposal and is allowlisted.

The current `graph` implementation still returns `not-implemented`. Every adapter result records `graph: false` in this phase. The execution engine records blocked or mock results in the local audit log.

## Permission Transition

The currently recorded Graph scopes remain `Mail.Read`, `MailboxSettings.Read`, and `User.Read`. `Mail.ReadWrite` is only a proposed future permission for folder creation and moving a message. It will be reviewed and added, if separately approved, in a later permission-transition stage. This design does not change permissions, OAuth, scopes, tokens, or mailbox state, and does not launch Microsoft consent.
