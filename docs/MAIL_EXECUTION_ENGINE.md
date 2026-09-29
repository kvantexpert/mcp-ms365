# Mail Execution Engine

## Architecture

The controlled execution foundation consumes an existing confirmation request
and creates a local `ExecutionRequest`:

```text
Preview proposal
      ↓
Confirmation manager
      ↓
prepareExecution
      ↓
ExecutionRequest (dryRun: true)
      ↓
validateWriteExecution
      ↓
Mock MailWriteAdapter
      ↓
Local audit log
```

`src/lib/mail-execution-engine.ts` has no Graph client dependency. It accepts
only confirmation IDs, and an approved confirmation can produce a `ready`
request for preview. Rejected, expired, missing, or unsupported confirmations
produce a `blocked` request.

## SAFE MODE

Every request is marked `dryRun: true`; mock execution never changes mailbox
state. `WRITE_EXECUTION_ENABLED` is false unless set to the literal string
`true`. `validateWriteExecution` requires that flag, an approved confirmation,
and an exact allowlisted operation. A valid request is dispatched to the local
mock adapter, never to Graph, and its result is recorded in the process-local
audit log. Rejected or otherwise blocked requests remain blocked. The `executed`
status in this phase means only that the mock adapter returned success.

The `preview-mail-execution` MCP utility accepts a confirmation ID, displays
the proposed action, target, status and reason, and is marked read-only and
closed-world. It does not expose or call Graph write APIs.

## ExecutionRequest

Each request records its ID, confirmation ID, action, message ID, target,
status, dry-run flag, creation time and reason. Only `move-message` is allowed
for preparation; no folder creation or rule creation is allowed.

## Audit

The local audit logger records action ID, message ID, action type, timestamp,
result and reason. The current log is in process memory and is intended only
to verify the SAFE MODE flow; it is not durable or a production audit store.

## Future Write Mode

The `mail-write-controlled` preset exposes only the `create-mail-folder` and
`move-mail-message` endpoints; direct calls are blocked and do not reach Graph.
The engine's adapter is mock-only. A future Graph adapter requires a separate
permission review and explicit approval, a new checkpoint, and tests limited to
the reviewed one-folder/one-message scenario. Any future implementation must
preserve preview, confirmation, audit, result verification and rollback
safeguards.

## Restrictions

This phase does not call Graph write APIs or change mailbox state. Folder
creation and message moves are simulated locally only. OAuth, permissions and
Graph scopes remain unchanged. `Mail.ReadWrite` is not enabled.
