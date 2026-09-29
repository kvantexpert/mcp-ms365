# Mail Assistant Phase 1 Complete Review

## 1. Project Goal

Build a safe Microsoft 365 MCP assistant that analyzes Outlook mail and prepares controlled organization workflows without changing mailbox data unless a later, separately approved stage explicitly enables a bounded write action.

## 2. Starting Point

Phase 1 started from an operational mcp-ms365 MCP server connected to Microsoft Graph and Codex. The verified foundation exposed mailbox reads through a read-only profile. The last confirmed delegated Graph permissions were `Mail.Read`, `MailboxSettings.Read`, and `User.Read`.

## 3. Completed Phases

### Phase 0 — MCP and Graph Connection

Codex connects to the mcp-ms365 stdio MCP server. Microsoft Graph mailbox read access was verified with the `mail-readonly` preset.

### Phase 1.1 — Mail Classification

Added local deterministic message classification with extensible categories. Classification returns analysis and recommendations only; it does not modify mailbox data.

### Phase 1.2 — Folder Structure Design

Documented a proposed mailbox folder structure and the relationship between message classification and future folder recommendations. No Outlook folders were created.

### Phase 1.3.1 — Dry Run Engine

Added a planner that creates a proposed organization action for preview. It does not execute mailbox changes.

### Phase 1.3.2 — Confirmation Layer

Added confirmation requests with pending, approved, rejected, and expired states. Approval changes local proposal state only.

### Phase 1.3.3 — Execution Foundation

Added the controlled execution engine and local audit foundation. Execution is gated by explicit configuration, confirmation state, and an operation allowlist.

### Phase 1.3.4 — Permission Preparation

Reviewed the permissions needed for the proposed folder creation and single-message move. `Mail.ReadWrite` was identified as a future delegated permission; the review itself did not grant it.

### Phase 1.3.5 — Controlled Write Mode

Added the separate `mail-write-controlled` preset with only `create-mail-folder` and `move-mail-message` in its endpoint allowlist. Direct write tool calls remain blocked in the current implementation.

### Phase 1.3.6 — Mock Write Adapter

Added an adapter interface and local mock adapter so validation, execution state, and audit behavior can be exercised without Graph writes.

### Phase 1.3.7 — Graph Write Adapter Preparation

Added an adapter factory and a Graph adapter placeholder. The placeholder returns `not-implemented`; no Graph write client is connected.

### Phase 1.3.8 — Permission Validation

Added a fail-closed check for the already-granted `Mail.ReadWrite` scope before Graph adapter selection. The check reads the existing token's delegated scope claim; it does not request permissions or initiate consent.

### Phase 1.3.9 — Pre-Write Checkpoint

Created the pre-write permission checkpoint at commit `1b6c7a6`. The annotated rollback tag is `mail-assistant-before-real-write-v1`. Permission activation remains pending.

## 4. Problems Found and Decisions

1. **Read and write tool surfaces were mixed in the broad mail preset.** A separate controlled-write preset now limits its endpoint allowlist to folder creation and message move.
2. **There was no explicit action approval state.** The confirmation layer records pending, approved, rejected, and expired proposals without executing them.
3. **A prepared action could be confused with an executed action.** Feature flags, confirmation checks, an operation allowlist, permission validation, and a Graph placeholder make the current path fail closed.
4. **There was no isolated way to exercise execution flow.** The mock adapter provides local-only results and records that no Graph request occurred.
5. **There was no clear rollback point before a future write transition.** Annotated Git checkpoints and the pre-write checkpoint document record the recovery point.
6. **A write permission could be broader than the planned scenario.** Permission review limits the proposed transition to `Mail.ReadWrite`; unrelated Calendar, Files, Teams, and Contacts scopes are excluded.

## 5. Current Architecture

```text
Outlook message data
        ↓
Local classification
        ↓
Action planner
        ↓
Dry-run proposal
        ↓
Confirmation state
        ↓
Execution engine and audit
        ↓
Permission validation (required for Graph mode)
        ↓
Adapter factory
        ├── Mock adapter (default; local-only)
        └── Graph adapter placeholder (not implemented)
```

The currently configured Codex MCP profile remains `mail-readonly`. The `mail-write-controlled` preset is separate and is used only for controlled-write preparation. The Graph adapter is not connected to Graph requests.

## 6. Current Security State

The last confirmed Microsoft Graph permissions are:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

`Mail.ReadWrite` has not been confirmed as granted. Write execution is **DISABLED**: `WRITE_EXECUTION_ENABLED` defaults to `false`, and `WRITE_ADAPTER_MODE` defaults to `mock`. The Graph-mode permission guard requires `WRITE_PERMISSION_REQUIRED=true` and an existing token containing `Mail.ReadWrite`.

The mailbox is unchanged by the implementation and validation work recorded here. No folder was created and no message was moved.

## 7. Current Position

**Phase 1 review is complete. Phase 1.3.9 permission activation is pending.** The project remains at the mock-only checkpoint. The next permission step must be performed separately and must verify the exact consent scope list before acceptance.

A device-code sign-in request was started immediately before the latest instruction to make no new login, then interrupted before the user completed authentication. No consent was accepted or successful login result verified in that attempt. The request is not evidence that `Mail.ReadWrite` was granted.

## 8. Next Steps

Only after separately authorized permission activation:

1. Verify sign-in using the same controlled preset and scope configuration used for consent.
2. Check the granted scopes and confirm only the reviewed set is present.
3. Implement and separately review a real Graph adapter; the current adapter is a placeholder.
4. Re-check execution flags, confirmation, and the operation allowlist before any write.
5. After explicit approval for the exact test, create `MCP-Test` and move one selected message from `Inbox` to that folder.
6. Verify the resulting state with Graph read operations and record the audit result.
7. If a rollback is needed, obtain separate approval before any mailbox write used to restore state.

No step in this review performs these future actions.

## 9. First Controlled Write Rules

The eventual test is limited to one test folder and one selected message, with explicit confirmation for the exact planned action. Bulk sorting, automatic rules, deletion, and sending mail are out of scope. Creating the folder and moving the message are separate Graph write requests; both require the future write path to be implemented and reviewed.
