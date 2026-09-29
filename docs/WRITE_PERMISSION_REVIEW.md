# Write Permission Review

## 1. Purpose

This document prepares for the first controlled mailbox change. The proposed test scenario is to create a test folder named `MCP-Test` and move one selected email from `Inbox` to `MCP-Test`.

This is a permission review only. No configuration, permission, mailbox, or Graph write operation is changed or performed by this document.

## 2. Current Permissions

The currently recorded Microsoft Graph permissions are:

- `Mail.Read`
- `MailboxSettings.Read`
- `User.Read`

Current mode: **READ ONLY**.

## 3. Required Operations

### Operation 1: Create a mail folder

The proposed Graph operation creates a folder in the user's mailbox using `POST /me/mailFolders`. Microsoft Graph documents delegated `Mail.ReadWrite` as the least-privileged permission for this operation ([Create mailFolder](https://learn.microsoft.com/en-us/graph/api/user-post-mailfolders?view=graph-rest-1.0)).

### Operation 2: Move one message

The proposed Graph operation moves one selected message using `POST /me/messages/{id}/move` with the destination folder ID. Microsoft Graph documents delegated `Mail.ReadWrite` as the least-privileged permission ([Move message](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)).

Graph's move operation creates a copy in the destination folder and removes the original. The implementation must retain the returned message ID and verify the resulting folder before reporting success.

### Operation 3: Verify the result

Use a Graph read operation to read the moved message and/or list the destination folder's messages. The existing `Mail.Read` permission supports reading messages and folders; no additional read scope is proposed for verification ([Get message](https://learn.microsoft.com/en-us/graph/api/message-get?view=graph-rest-1.0), [List mailFolders](https://learn.microsoft.com/en-us/graph/api/user-list-mailfolders?view=graph-rest-1.0)).

## 4. Permission Analysis

The current `Mail.Read` scope permits reading mail but does not authorize creating folders or moving messages. For the two proposed write operations, Microsoft Graph lists delegated `Mail.ReadWrite` as the least-privileged permission for each operation ([Create mailFolder](https://learn.microsoft.com/en-us/graph/api/user-post-mailfolders?view=graph-rest-1.0), [Move message](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)).

`Mail.ReadWrite` is a proposed future permission only. It is not added, consented to, or enabled here. The current permissions and READ ONLY mode remain unchanged.

## 5. Minimal Permission Principle

Use only the minimum permissions required for the approved mailbox scenario. Do not add Calendar, Files, Teams, Contacts, or unrelated Microsoft Graph scopes. Any future write permission requires a separate review and explicit approval.

## 6. First Write Test Scope

If separately approved in a future stage, the test is limited to:

- one test folder, `MCP-Test`;
- one selected email;
- one user mailbox;
- one explicit user confirmation covering the planned operation.

Before creating the folder, verify that `MCP-Test` does not already exist. If it exists, stop and request a different reviewed plan; do not reuse or delete an existing folder. No bulk sorting, automatic rules, or bulk moves are in scope.

## 7. Safety Workflow

Current workflow:

```text
Classification
    ↓
Preview
    ↓
Confirmation
    ↓
Execution Engine (SAFE MODE: blocked)
```

Future workflow, only after a separate approval gate:

```text
Classification
    ↓
Preview exact folder creation and single-message move
    ↓
One explicit user confirmation
    ↓
Controlled execution: create MCP-Test, then move the selected message
    ↓
Read-only verification and audit
```

The current execution engine remains SAFE MODE and does not call Graph write APIs. It currently supports only the `move-message` proposal shape; controlled folder creation would need to be designed and implemented under its own reviewed scope before this two-operation scenario can be executed.

## 8. Consent Procedure

Only in a separately approved future implementation:

1. Update the application configuration to request the reviewed minimum write scope.
2. Start the login flow.
3. Inspect the Microsoft permissions consent screen.
4. Confirm that only the reviewed required permissions are requested, including `Mail.ReadWrite` for the proposed folder creation and message move.
5. Complete consent only after explicit approval.
6. Run `verify-login` and confirm the granted permissions.
7. Perform only the bounded one-folder, one-message test and verify it using read operations.

No scope configuration, login, or consent is performed as part of this review.

## 9. Rollback Plan

If a future approved test fails:

- use the audit record and returned message ID to move the test message back to its recorded source folder, after checking its current location;
- delete `MCP-Test` only if this test created it and it is empty, with no unrelated content;
- disable the write mode/configuration;
- return to the reviewed checkpoint if needed and verify the mailbox state with read operations.

Because Graph move creates a new copy and removes the original, record the source folder, original message ID, returned destination message ID, timestamp, confirmation, and result. Verify each rollback step; do not assume it succeeded.

## 10. Approval Gate

Before the first write action, require all of the following:

- separate explicit user approval for the exact operation;
- a new checkpoint;
- a clean Git working tree;
- successful relevant tests;
- completed permission review and consent;
- a bounded audit and verification plan.

Until every gate is met, the system remains READ ONLY.

## 11. Next Step

The next roadmap stage is **Phase 1.3.4 — First Controlled Write** (status: **Permission Review**). It may include a dedicated branch or checkpoint, a separately approved permission change, the single `MCP-Test` scenario, and an audit log. This document does not authorize or perform that implementation.
