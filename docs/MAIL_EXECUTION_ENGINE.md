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
executeAction (SAFE MODE: blocked)
      ↓
Local audit log
```

`src/lib/mail-execution-engine.ts` has no Graph client dependency. It accepts
only confirmation IDs, and an approved confirmation can produce a `ready`
request for preview. Rejected, expired, missing, or unsupported confirmations
produce a `blocked` request.

## SAFE MODE

Every request is marked `dryRun: true`. Calling `executeAction` never invokes
Graph. A ready request is changed to `blocked` with reason `write execution disabled`;
its result is recorded in the process-local audit log. Rejected or otherwise
blocked requests remain blocked. The `executed` and `failed` statuses are
reserved for a future, separately reviewed implementation and are not entered
by this foundation.

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

This foundation does not enable write mode. A future execution implementation
requires a separate permission review and explicit approval, a new checkpoint,
and tests limited to one selected test email in an existing verified folder.
Any future implementation must preserve preview, confirmation, audit, result
verification and rollback safeguards.

## Restrictions

This phase does not call Graph write APIs, move messages, create folders or
rules, or change mailbox state. OAuth, permissions and Graph scopes remain
unchanged. `Mail.ReadWrite` is not enabled.
