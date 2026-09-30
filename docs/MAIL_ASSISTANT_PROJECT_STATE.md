# Mail Assistant Project State

## 1. Project Overview

The project builds a safe MCP assistant for analyzing Outlook mail and preparing controlled organization workflows. It uses the existing `mcp-ms365` server and Microsoft Graph. Mailbox changes require a separate, bounded, explicitly confirmed execution stage.

## 2. Completed Section 1 — Mail Assistant Foundation

**Status: Foundation completed; final permission activation pending.** The read-only intelligence, planning, confirmation, mock execution, permission analysis, and OAuth recovery foundation is documented and implemented. The fresh permission attempt completed authentication and Graph `/me` verification, but the scope metadata check found extra permissions and could not verify the granted `scp` claim. No real mailbox write has been performed.

### MCP Integration

- The MCP server is integrated with Codex.
- Microsoft Graph mail read access was verified earlier with the `mail-readonly` preset.
- The read-only foundation does not modify the mailbox.

### Mail Understanding

- Local deterministic email classification is implemented.
- Categories include Clients, Projects, Finance, Documents, Security, Automation, and Personal.
- Message analysis uses sender, subject, preview, and available metadata.

### Organization Planning

- Folder structure is designed.
- The action planner creates recommendations.
- Dry-run previews proposed organization actions without changing Outlook.

### Safety Layer

- Confirmation requests support pending, approved, rejected, and expired states.
- Approval changes proposal state only; it does not itself execute a mailbox operation.
- Local audit foundations exist.

### Controlled Execution

- The execution engine validates confirmation and an operation allowlist.
- A feature flag gates execution and defaults off.
- The adapter defaults to mock mode; the controlled write preparation does not enable Graph writes.

### Permission Security

- Permission review and fail-closed write permission validation are documented and implemented.
- OAuth diagnostics distinguish requested scope metadata from a verified token `scp` claim.
- The local token and selected-account cache reset completed; the cache encryption key was preserved.

## 3. Problems Found and Fixes

### Problem 1 — Read and write capabilities needed isolation

**Fix:** Prepared a separate `mail-write-controlled` mode with a narrow allowlist. Real execution remains gated; `mail-readonly` remains distinct.

### Problem 2 — Actions had no explicit approval state

**Fix:** Added a confirmation layer for approve and reject decisions. Approval does not invoke an executor.

### Problem 3 — Accidental Graph write risk

**Fix:** Added a mock adapter, allowlist, feature flag, permission validation, and dry-run/preflight checks. No Graph write API has been called.

### Problem 4 — Login could appear successful without a reusable persisted token

**Fix:** Tightened token persistence validation and added OAuth cache/account diagnostics. A fresh token session still needs to be established and validated after the cache reset.

### Problem 5 — Broad scope metadata in the local cache

**Fix:** Added permission-scope diagnostics and executed a local OAuth state reset. The reset removed only token and selected-account cache records and preserved the encryption key.

### Problem 6 — MSAL reported permissions outside the requested set

**Fix:** Added permission cleanup analysis and rejected that activation as unverified. The local reset does not revoke Microsoft consent or change the remote app registration, so a future consent result must still be inspected and may again contain extra permissions.

## 4. Current Security State

- Permissions are **not currently confirmed for write**. The new login requested the minimal set, but cached scope metadata contains unrequested scopes; granted scopes could not be verified.
- A fresh local account/token cache now exists after device login. `diagnose-auth` reports one account and cached scope target metadata; `diagnose-permissions` reports extra scopes and `grantVerified=false`.
- `WRITE_EXECUTION_ENABLED` defaults to `false`.
- `WRITE_ADAPTER_MODE` defaults to `mock`.
- Mailbox state is unchanged.

## 5. Current Position

**Section 1 — Mail Assistant Foundation: Implementation completed; final activation gate pending.**

**Current gate: Phase 1.3.9.7 — Fresh Permission Activation, Pending.** The latest device login requested the three reviewed scopes, but cached metadata included extras. The next session must investigate and establish a verified minimal permission result before Section 2:

- `Mail.ReadWrite`
- `MailboxSettings.Read`
- `User.Read`

No new OAuth login or consent was run during this documentation checkpoint. Do not infer current permissions from preset requirements or old cache metadata.

## 6. Section 2 Plan — Mail Organization Engine

Section 2 is **ready after permission activation and write-path validation**. The phases below describe future work; they do not authorize execution in the current checkpoint.

### 2.1 First Controlled Write

Create the `MCP-Test` folder only after the fresh permission result is verified, the Graph write adapter is implemented and reviewed, a new checkpoint exists, and the user explicitly approves the operation.

### 2.2 First Message Move

Move one specifically selected message from `Inbox` to `MCP-Test`. Verify the result and record an audit entry. Do not combine folder creation and message movement into an unreviewed batch.

### 2.3 Organization Engine

After the one-message scenario is reviewed, plan bounded organization capabilities by:

- topic;
- sender;
- project;
- document type.

Begin with proposals and previews. Do not enable bulk execution by default.

### 2.4 Automation

Design rules as proposals first. Any later execution requires explicit confirmation, validation, audit, a permission review, and a separate checkpoint.

## 7. Rules for Section 2

1. Begin with one folder.
2. Limit the first message operation to one selected email.
3. Route every write through **Preview → Confirmation → Validation → Audit**.
4. Stop if returned permissions exceed the reviewed minimal set.
5. Keep write execution disabled and the adapter in mock mode until a separately approved implementation stage.

## 8. Checkpoint

The Section 1 completion tag `mail-assistant-section1-complete-v1` records the commit containing this project-state documentation and roadmap update. The earlier rollback tag `mail-assistant-before-oauth-consent-reset-v1` remains the pre-reset code checkpoint.
