# Mail Write Adapter

## Purpose

The adapter isolates mailbox write operations behind a small interface. This phase uses a local mock implementation to exercise validation, execution, and audit flow without contacting Microsoft Graph.

## Allowed Operations

The adapter interface supports only:

- `create-folder` via `createFolder({ parentFolderId, displayName })`;
- `move-message` via `moveMessage({ messageId, destinationFolderId })`.

The mock returns a synthetic resource ID and marks each result with `mode: "mock"`. It does not create a real folder or move a real message.

## Safety Checks

Before dispatching to the adapter, `validateWriteExecution` checks:

1. `WRITE_EXECUTION_ENABLED` is exactly `true`;
2. the confirmation request exists and has status `approved`;
3. the approved proposal matches the requested operation;
4. the operation is in the allowlist (`create-folder`, `move-message`).

If any check fails, the request is blocked with `write execution validation failed` and the adapter is not called. The execution engine records the outcome in its local audit log.

## Current Mode

**MOCK ONLY**. The default adapter is `mock-mail-write-adapter.ts`. It has no Graph client dependency. `dryRun` remains true because no mailbox state is changed; an `executed` status means only that a mock call succeeded. Direct MCP Graph write endpoints remain blocked in this phase.

## Future

A Graph-backed implementation requires a separate permission transition, explicit user approval, checkpoint, tests, durable audit, result verification, and rollback safeguards. No Graph adapter is included or connected here.
